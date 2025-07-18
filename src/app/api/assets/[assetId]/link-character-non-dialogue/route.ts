//src/app/api/assets/[assetId]/link-character-non-dialogue/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { AssetClassification } from '@prisma/client';
import { z } from 'zod';

const linkCharacterSchema = z.object({
  characterId: z.number(),
});

export async function POST(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }

    try {
        const assetId = parseInt(params.assetId, 10);
        const body = await request.json();
        const validation = linkCharacterSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: "Geçersiz veri: characterId gerekli." }, { status: 400 });
        }
        const { characterId } = validation.data;
        
        // TODO: Yetki kontrolü (kullanıcının bu asset'in projesinde olduğundan emin ol)

        const result = await prisma.$transaction(async (tx) => {
            // 1. Asset'i "NON_DIALOGUE_VOCAL" olarak sınıflandır.
            await tx.asset.update({
                where: { id: assetId },
                data: { classification: AssetClassification.NON_DIALOGUE_VOCAL },
            });

            // 2. Bu asset için "referans" oluşturan, diyalogsuz bir TranslationLine yarat.
            // Bu, sistemin tutarlılığı için en önemli adımdır.
            const newLine = await tx.translationLine.create({
                data: {
                    // Bu satırın kaynağı da bu asset'in kendisidir.
                    sourceAssetId: assetId, 
                    // Benzersiz bir key oluşturuyoruz.
                    key: `non_dialogue_${assetId}`, 
                    // Bu bir diyalog değil.
                    isNonDialogue: true, 
                    // Karakteri bağlıyoruz.
                    characterId: characterId, 
                    // Bu satırın orijinal ses referansı, asset'in kendisidir.
                    originalVoiceReferenceAssetId: assetId, 
                    // Bu tür satırlar direkt onaylı olabilir, çeviri gerektirmez.
                    status: 'APPROVED', 
                },
            });

            return newLine;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("[LINK_CHAR_NON_DIALOGUE_ERROR]", error);
        // Eğer aynı key ile oluşturmaya çalışırsak (örn. butona 2. kez basılırsa)
        // Prisma P2002 hatası verir. Bunu yakalayalım.
        if (error.code === 'P2002') {
            return new NextResponse('Bu ses dosyası için zaten bir atama yapılmış.', { status: 409 });
        }
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}
