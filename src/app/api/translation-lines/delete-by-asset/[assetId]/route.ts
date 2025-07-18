//src/app/api/translation-lines/delete-by-asset/[assetId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// DELETE: Belirli bir sese (asset) bağlı olan DİYALOGSUZ çeviri satırını siler.
export async function DELETE(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    try {
        const assetId = parseInt(params.assetId, 10);
        
        // Bu sese referans veren VE diyalogsuz olan TÜM satırları SİL.
        // Bu, veritabanında yetim kayıt kalmamasını garanti eder.
        await prisma.translationLine.deleteMany({
            where: {
                originalVoiceReferenceAssetId: assetId,
                isNonDialogue: true,
            }
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("[DELETE_NON_DIALOGUE_LINE_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}
