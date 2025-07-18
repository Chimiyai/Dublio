//src/app/api/translation-lines/[lineId]/link-audio/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { AssetClassification } from '@prisma/client';

const linkAudioSchema = z.object({
  assetId: z.number(),
  characterId: z.number().optional(), // Karakter ataması opsiyonel olabilir
  isNonDialogue: z.boolean().optional().default(false), // Replik diyalogsuz mu?
});

export async function PUT(
  request: Request,
  { params }: { params: { lineId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }

    const lineId = parseInt(params.lineId, 10);
    const body = await request.json();
    const validation = linkAudioSchema.safeParse(body);
    
    if (!validation.success) {
        return NextResponse.json({ message: 'Geçersiz veri', errors: validation.error.format() }, { status: 400 });
    }
    const { assetId, characterId, isNonDialogue } = validation.data;

    // TODO: Yetki kontrolü (kullanıcı bu projenin üyesi mi?) eklenebilir.

    // İşlemi bir transaction içinde yapalım ki tutarlı olsun
    const result = await prisma.$transaction(async (tx) => {
      // 1. TranslationLine'ı güncelle: Sesi ve karakteri bağla
      const updatedLine = await tx.translationLine.update({
        where: { id: lineId },
        data: {
          originalVoiceReferenceAssetId: assetId,
          characterId: characterId,
          isNonDialogue: isNonDialogue,
        },
      });

      // 2. Asset'i "DIALOGUE" veya "NON_DIALOGUE_VOCAL" olarak sınıflandır
      await tx.asset.update({
        where: { id: assetId },
        data: {
          classification: isNonDialogue ? AssetClassification.NON_DIALOGUE_VOCAL : AssetClassification.DIALOGUE,
        },
      });

      return updatedLine;
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[LINK_AUDIO_ERROR]', error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}