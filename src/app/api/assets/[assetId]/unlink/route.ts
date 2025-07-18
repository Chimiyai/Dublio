//src/app/api/assets/[assetId]/unlink/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// ... (gerekirse yetki kontrolü için session importları)

export async function POST(
    request: Request,
    context: { params: { assetId: string } }
) {
    const params = await context.params;
    try {
        const assetId = parseInt(params.assetId, 10);
        // TODO: Yetki Kontrolü

        // Bu asset'i referans alan tüm çeviri satırlarını bul ve bağlantıyı kopar.
        await prisma.translationLine.updateMany({
            where: {
                originalVoiceReferenceAssetId: assetId
            },
            data: {
                originalVoiceReferenceAssetId: null,
                // İsteğe bağlı olarak karakteri de sıfırlayabilirsiniz
                // characterId: null
            }
        });

        return NextResponse.json({ message: "Bağlantı başarıyla koparıldı." });

    } catch (error) {
        console.error("[ASSET_UNLINK_ERROR]", error);
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}