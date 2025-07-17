// src/app/api/translation-lines/[lineId]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { TranslationStatus, Prisma } from '@prisma/client';

// --- TEK BİR ÇEVİRİ SATIRININ DETAYLARINI GETİRME (GET) ---
export async function GET(
    request: Request,
    { params }: { params: { lineId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const lineId = parseInt(params.lineId, 10);
        
        if (!session?.user?.id || isNaN(lineId)) {
            return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
        }
        const userId = parseInt(session.user.id);

        // Yetki kontrolü (kullanıcının o projede üye olup olmadığı)
        const lineWithProjectInfo = await prisma.translationLine.findFirst({
        where: { 
            id: lineId,
            sourceAsset: {
                translatableAsset: { // Doğru yol: translatableAsset üzerinden
                    project: {
                        team: { members: { some: { userId: userId } } }
                    }
                }
            }
        },
    });

        if (!lineWithProjectInfo) {
            return new NextResponse('Replik bulunamadı veya bu repliği görme yetkiniz yok.', { status: 404 });
        }
        
        // Yetki varsa, repliğin tüm detaylarını çekip gönder
        // findFirst zaten tüm alanları döndürür, ama daha detaylı include için tekrar sorgulayabiliriz.
        const line = await prisma.translationLine.findUnique({
        where: { id: lineId },
        include: {
            character: { select: { id: true, name: true, profileImage: true } },
            // DÜZELTME: isNonDialogue, Asset'te yok.
            originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } },
            sourceAsset: { select: { id: true, name: true, path: true, type: true } }
        }
    });

        return NextResponse.json(line);

    } catch (error) {
        console.error(`[GET_TRANSLATION_LINE_DETAILS_ERROR]`, error);
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}


// --- ÇEVİRİ SATIRINI GÜNCELLEME (PUT) ---
// Zod şeması PUT fonksiyonunun hemen üstünde tanımlanmalı.
const updateLineDetailsSchema = z.object({
    translatedText: z.string().optional(),
    characterId: z.number().int().nullable().optional(), 
    originalVoiceReferenceAssetId: z.number().int().nullable().optional(),
    isNonDialogue: z.boolean().optional(),
    notes: z.string().max(500).nullable().optional(),
    status: z.nativeEnum(TranslationStatus).optional(),
});

export async function PUT(
    request: Request,
    { params }: { params: { lineId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const lineId = parseInt(params.lineId, 10);
        if (!session?.user?.id || isNaN(lineId)) {
            return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
        }
        const userId = parseInt(session.user.id);
        
        // DÜZELTME: Yetki kontrolünü tek ve verimli bir sorguyla yapalım.
        const lineWithMembership = await prisma.translationLine.findFirst({
            where: {
                id: lineId,
                sourceAsset: {
                    translatableAsset: {
                        project: {
                            team: {
                                members: {
                                    some: { userId: userId }
                                }
                            }
                        }
                    }
                }
            },
            select: {
                sourceAsset: {
                    select: {
                        translatableAsset: {
                            select: {
                                project: {
                                    select: {
                                        team: {
                                            select: {
                                                members: {
                                                    where: { userId: userId },
                                                    select: { role: true }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!lineWithMembership) {
            return new NextResponse('Replik bulunamadı veya bu projeye erişiminiz yok.', { status: 404 });
        }
        
        // DÜZELTME: userRole değişkenini burada tanımlıyoruz.
        const userRole = lineWithMembership.sourceAsset?.translatableAsset?.project?.team?.members[0]?.role;
        const allowedRoles = ['LEADER', 'ADMIN', 'MODDER', 'TRANSLATOR'];
        
        if (!userRole || !allowedRoles.includes(userRole)) {
            return new NextResponse('Bu işlemi yapma yetkiniz yok.', { status: 403 });
        }
        
        const body = await request.json();
        const validation = updateLineDetailsSchema.safeParse(body);
        if(!validation.success) {
            return new NextResponse(JSON.stringify({ message: "Geçersiz veri", errors: validation.error.flatten().fieldErrors }), { status: 400 });
        }
        
        const dataToUpdate: Prisma.TranslationLineUpdateInput = {};
        const { translatedText, characterId, originalVoiceReferenceAssetId, isNonDialogue, notes, status } = validation.data;

        if (characterId !== undefined) {
            dataToUpdate.character = characterId ? { connect: { id: characterId } } : { disconnect: true };
        }
        if (originalVoiceReferenceAssetId !== undefined) {
            dataToUpdate.originalVoiceReferenceAsset = originalVoiceReferenceAssetId ? { connect: { id: originalVoiceReferenceAssetId } } : { disconnect: true };
        }
        
        // Diğer alanlar...
        if (translatedText !== undefined) dataToUpdate.translatedText = translatedText;
        if (isNonDialogue !== undefined) dataToUpdate.isNonDialogue = isNonDialogue;
        if (notes !== undefined) dataToUpdate.notes = notes;
        if (status !== undefined) dataToUpdate.status = status;
        
        const updatedLine = await prisma.translationLine.update({
            where: { id: lineId },
            data: dataToUpdate,
            include: {
                character: { select: { id: true, name: true, profileImage: true } },
                originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } },
                sourceAsset: { select: { id: true, name: true, path: true, type: true } }
            }
        });

        return NextResponse.json(updatedLine);
    } catch (error) {
        console.error(`[UPDATE_TRANSLATION_LINE_ERROR]`, error);
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}
