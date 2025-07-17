// src/app/api/admin/assets/[assetId]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Prisma'nın hata tipleri için import edelim

// Sadece güncellemek istediğimiz alanları içeren Zod şeması.
// Bu, gereksiz veya istenmeyen verilerin body'de gelmesini engeller.
const updateAssetSchema = z.object({
    isNonDialogue: z.boolean(), // Artık zorunlu, çünkü bu rota sadece bu işi yapıyor.
});
export async function GET(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const assetId = parseInt(params.assetId, 10);
        if (!session?.user?.id || isNaN(assetId)) {
            return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
        }
    } catch (error) {
        console.error("[GET_ASSET_ERROR]", error);
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}