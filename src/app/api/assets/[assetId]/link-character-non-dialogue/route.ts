//src/app/api/assets/[assetId]/link-character-non-dialogue/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { AssetClassification } from '@prisma/client';

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
        const { characterId } = body;

        if (!characterId) {
            return NextResponse.json({ message: 'Karakter ID gerekli.' }, { status: 400 });
        }

        // İşlemleri tek bir transaction'da yapalım ki tutarlı olsun
        const result = await prisma.$transaction(async (tx) => {
            // 1. Önce bu sese bağlı eski bir diyalogsuz satır var mı diye kontrol et ve sil.
            // Bu, "Geri Al" işlemi başarısız olsa bile sistemi temizler.
            await tx.translationLine.deleteMany({
                where: {
                    originalVoiceReferenceAssetId: assetId,
                    isNonDialogue: true,
                }
            });

            // 2. YENİ bir TranslationLine oluştur
            const newLine = await tx.translationLine.create({
                data: {
                    // Bu satırın bir metin dosyasından gelmediğini belirtmek için
                    // sourceAssetId'yi assetId'nin kendisine bağlıyoruz.
                    // Ya da projedeki "dummy" bir text asset'ine bağlanabilir.
                    // Şimdilik en basit çözüm:
                    sourceAsset: { connect: { id: assetId } },
                    key: `non_dialogue_${assetId}_${characterId}`, // Benzersiz bir key
                    isNonDialogue: true,
                    status: 'APPROVED', // Direkt onaylı olsun
                    character: { connect: { id: characterId } },
                    originalVoiceReferenceAsset: { connect: { id: assetId } },
                }
            });

            // 3. Asset'in kendisini de NON_DIALOGUE_VOCAL olarak sınıflandır
            await tx.asset.update({
                where: { id: assetId },
                data: { classification: AssetClassification.NON_DIALOGUE_VOCAL },
            });

            return newLine;
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error("[LINK_NON_DIALOGUE_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}
