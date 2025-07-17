// src/app/api/admin/projects/[projectId]/assets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { writeFile } from 'fs/promises';
import path from 'path';
import { AssetType } from '@prisma/client';

export async function POST(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return new NextResponse('Yetkisiz', { status: 403 });
        }
        
        const projectId = parseInt(params.projectId, 10);
        const project = await prisma.project.findUnique({ where: { id: projectId }});
        if (!project) {
            return new NextResponse('Proje bulunamadı', { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as AssetType | null;

        if (!file || !type) {
            return new NextResponse('Eksik bilgi: dosya ve tip gereklidir', { status: 400 });
        }

        // Dosya kaydetme...
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueFilename = `${Date.now()}_${file.name}`;
        const filePath = path.join('public', 'uploads', 'assets', uniqueFilename);
        await writeFile(filePath, buffer);
        const dbPath = `/uploads/assets/${uniqueFilename}`;

        // === DÜZELTME: İşlemi iki adıma ayırıyoruz ===

        // 1. Önce yeni Asset'i oluştur.
        const newAsset = await prisma.asset.create({
            data: {
                name: file.name,
                path: dbPath,
                type: type,
                uploadedById: parseInt(session.user.id),
                contentId: project.contentId,
            }
        });

        // 2. Sonra, oluşturulan Asset'in ID'sini kullanarak ProjectAssetSetting'i oluştur.
        const newSetting = await prisma.projectAssetSetting.create({
            data: {
                projectId: projectId,
                assetId: newAsset.id // Yeni asset'in ID'sini burada kullanıyoruz.
            },
            include: { // İstemciye göndermek için ilişkili veriyi çek
                asset: {
                    include: {
                        uploader: { select: { username: true } }
                    }
                }
            }
        });

        return NextResponse.json(newSetting, { status: 201 });

    } catch (error) {
        console.error("[CREATE_ASSET_AND_SETTING_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}