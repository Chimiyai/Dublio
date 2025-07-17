// src/app/api/projects/[projectId]/asset-settings/[assetId]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const updateSettingSchema = z.object({
    isNonDialogue: z.boolean(),
});

export async function PUT(
    request: Request,
    { params }: { params: { projectId: string, assetId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new NextResponse('Yetkisiz', { status: 401 });

        const projectId = parseInt(params.projectId, 10);
        const assetId = parseInt(params.assetId, 10);
        
        // ... (Buraya da yetki kontrolü eklenebilir: kullanıcı bu projenin üyesi mi?)

        const body = await request.json();
        const validation = updateSettingSchema.safeParse(body);
        if (!validation.success) {
            return new NextResponse('Geçersiz veri', { status: 400 });
        }

        // upsert: Eğer bu proje-asset için ayar varsa GÜNCELLE, yoksa OLUŞTUR.
        const setting = await prisma.projectAssetSetting.upsert({
            where: {
                projectId_assetId: { projectId, assetId }
            },
            update: {
                isNonDialogue: validation.data.isNonDialogue
            },
            create: {
                projectId,
                assetId,
                isNonDialogue: validation.data.isNonDialogue
            },
            include: {
                asset: true // İstemcinin state'i güncellemesi için asset bilgisini de döndür.
            }
        });

        return NextResponse.json(setting);

    } catch (error) {
        console.error("[UPSERT_ASSET_SETTING_ERROR]", error);
        return new NextResponse('Sunucu Hatası', { status: 500 });
    }
}