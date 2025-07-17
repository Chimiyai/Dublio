// src/app/api/assets/[assetId]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const updateAssetSchema = z.object({
  isNonDialogue: z.boolean().optional(),
  // gelecekte başka alanlar da eklenebilir
});

export async function PUT(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Yetkisiz', { status: 401 });
        }
        
        const assetId = parseInt(params.assetId, 10);
        
        // Yetki Kontrolü: Kullanıcı bu asset'in ait olduğu projede yetkili mi?
        const asset = await prisma.asset.findFirst({
            where: {
                id: assetId,
                project: {
                    team: {
                        members: { some: { userId: parseInt(session.user.id), role: { in: ['LEADER', 'ADMIN', 'MODDER'] } } }
                    }
                }
            }
        });
        
        if (!asset) {
            return new NextResponse('Asset bulunamadı veya bu işlem için yetkiniz yok.', { status: 404 });
        }

        const body = await request.json();
        const validation = updateAssetSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: "Geçersiz veri" }, { status: 400 });
        }

        const updatedAsset = await prisma.asset.update({
            where: { id: assetId },
            data: validation.data
        });

        return NextResponse.json(updatedAsset);

    } catch (error) {
        console.error("[ASSET_UPDATE_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}