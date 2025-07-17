// src/app/api/translation-lines/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { TranslationStatus } from '@prisma/client';

// DÜZELTİLDİ: Şemaya uygun alan adları kullanıldı.
const createTranslationLineSchema = z.object({
  sourceAssetId: z.number().int(), // `assetId` değil
  key: z.string().min(1, "Anahtar boş olamaz."),
  originalVoiceReferenceAssetId: z.number().int().nullable().optional(), // `originalVoiceAssetId` değil
  characterId: z.number().int().nullable().optional(),
  originalText: z.string().nullable().optional(),
  translatedText: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.nativeEnum(TranslationStatus).optional(),
  isNonDialogue: z.boolean().optional(), // Bu alan TranslationLine'a ait
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Yetkisiz', { status: 401 });
    
    // TODO: Yetki kontrolü
    
    const body = await request.json();
    const validation = createTranslationLineSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify({ message: "Geçersiz veri", errors: validation.error.flatten().fieldErrors }), { status: 400 });
    }
    
    const { 
        sourceAssetId,
        key,
        originalVoiceReferenceAssetId,
        characterId,
        isNonDialogue,
        notes,
        status
    } = validation.data;

    // Gelen metin boşsa null olarak kaydet
    const finalOriginalText = validation.data.originalText?.trim() === '' ? null : validation.data.originalText;
    const finalTranslatedText = validation.data.translatedText?.trim() === '' ? null : validation.data.translatedText;

    // DÜZELTİLDİ: Prisma create sorgusunda doğru alan ve ilişki isimleri kullanıldı.
    const newLine = await prisma.translationLine.create({
      data: {
        sourceAssetId: sourceAssetId, // `assetId` -> `sourceAssetId`
        key: key,
        originalText: finalOriginalText,
        translatedText: finalTranslatedText,
        status: status || TranslationStatus.NOT_TRANSLATED,
        notes: notes,
        isNonDialogue: isNonDialogue || false,
        voiceRecordingUrl: null,
        characterId: characterId,
        originalVoiceReferenceAssetId: originalVoiceReferenceAssetId, // `originalVoiceAssetId` -> `originalVoiceReferenceAssetId`
      },
      include: {
        // `include` içindeki ilişki isimleri de şemadakiyle aynı olmalı
        character: { select: { id: true, name: true, profileImage: true } },
        originalVoiceReferenceAsset: { select: { id:true, name:true, path:true, type:true } },
        sourceAsset: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(newLine, { status: 201 });

  } catch (error) {
    console.error("[CREATE_TRANSLATION_LINE_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}