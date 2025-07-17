// src/app/api/admin/projects/[projectId]/sync-assets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    try {
        const projectId = parseInt(params.projectId, 10);
        
        // 1. Projeyi ve bağlı olduğu content'i bul
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { contentId: true }
        });

        if (!project) return new NextResponse('Proje bulunamadı', { status: 404 });

        // 2. O content'e ait tüm asset'leri bul
        const allContentAssets = await prisma.asset.findMany({
            where: { contentId: project.contentId },
            select: { id: true }
        });

        // 3. Bu proje için zaten ayarı olan asset'leri bul
        const existingSettings = await prisma.projectAssetSetting.findMany({
            where: { projectId: projectId },
            select: { assetId: true }
        });
        const existingAssetIds = new Set(existingSettings.map(s => s.assetId));

        // 4. Henüz ayarı olmayan asset'leri filtrele
        const newSettingsData = allContentAssets
            .filter(asset => !existingAssetIds.has(asset.id))
            .map(asset => ({
                projectId: projectId,
                assetId: asset.id,
                isNonDialogue: false // Varsayılan değer
            }));

        // 5. Eğer eklenecek yeni ayar varsa, veritabanına ekle
        if (newSettingsData.length > 0) {
            // === DÜZELTME: `skipDuplicates: true` satırını kaldırıyoruz. ===
            await prisma.projectAssetSetting.createMany({
                data: newSettingsData,
            });
        }
        
        return NextResponse.json({ 
            message: "Senkronizasyon tamamlandı.",
            createdCount: newSettingsData.length 
        });

    } catch (error) {
        console.error("[SYNC_ASSETS_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}
