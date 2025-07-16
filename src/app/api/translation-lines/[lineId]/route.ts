//src/app/api/translation-lines/[lineId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { TaskStatus, TaskType, TranslationStatus } from '@prisma/client';

const updateLineDetailsSchema = z.object({
    translatedText: z.string().optional(), // Çevirmen kullanır
    // Modder'ın güncelleyeceği alanlar
    characterId: z.number().int().positive().nullable().optional(), // Karakter ID'si, null olabilir
    originalVoiceAssetId: z.number().int().positive().nullable().optional(), // Orijinal ses asset ID'si, null olabilir
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
        
        // TODO: Yetki kontrolü - Sadece proje üyesi (veya Modder/Lider/Admin) bu satırı güncelleyebilmeli.
        // Bu repliğin ait olduğu projeyi bulup, kullanıcının o projenin ekibinde olup olmadığını kontrol et.
        const line = await prisma.translationLine.findUnique({
            where: { id: lineId },
            select: { asset: { select: { projectId: true } } }
        });
        if (!line) return new NextResponse('Replik bulunamadı.', { status: 404 });

        const project = await prisma.project.findUnique({
            where: { id: line.asset.projectId },
            select: { team: { select: { members: { where: { userId: userId }, select: { role: true } } } } }
        });
        const isModderOrLeaderOrAdmin = project?.team.members.some(m => ['LEADER', 'ADMIN', 'MODDER', 'TRANSLATOR'].includes(m.role));
        if (!isModderOrLeaderOrAdmin) {
            return new NextResponse('Bu işlemi yapma yetkiniz yok.', { status: 403 });
        }


        const body = await request.json();
        const validation = updateLineDetailsSchema.safeParse(body);
        if(!validation.success) {
            return new NextResponse(JSON.stringify({ message: "Geçersiz veri", errors: validation.error.flatten().fieldErrors }), { status: 400 });
        }
        
        // Veriyi güvenli bir şekilde alıyoruz
        const { translatedText, characterId, originalVoiceAssetId } = validation.data;

        const updatedLine = await prisma.translationLine.update({
            where: { id: lineId },
            data: {
                translatedText: translatedText,
                status: (translatedText !== undefined && translatedText.trim() === '') ? TranslationStatus.NOT_TRANSLATED : TranslationStatus.TRANSLATED,
                characterId: characterId, // Yeni alan
                originalVoiceAssetId: originalVoiceAssetId, // Yeni alan
            }
        });

        return NextResponse.json(updatedLine);

    } catch (error) {
        console.error(`[UPDATE_LINE_ERROR]`, error);
        return new NextResponse(JSON.stringify({ message: 'Sunucu hatası' }), { status: 500 });
    }
}
