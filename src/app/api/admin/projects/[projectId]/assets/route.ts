// src/app/api/admin/projects/[projectId]/assets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { writeFile } from 'fs/promises';
import path from 'path';
import { AssetType } from '@prisma/client';

// DÜZELTME: Fonksiyon imzası, Next.js'in beklediği şekilde güncellendi.
export async function POST(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return new NextResponse('Yetkisiz', { status: 403 });
        }
        
        // DÜZELTME: projectId artık doğru yerden geliyor.
        const projectId = parseInt(params.projectId, 10);
        if (isNaN(projectId)) {
            return new NextResponse('Geçersiz Proje ID', { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as AssetType | null;

        if (!file || !type) {
            return new NextResponse('Eksik bilgi: dosya ve tip gereklidir', { status: 400 });
        }

        // Dosyayı sunucuya kaydetme
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueFilename = `${Date.now()}_${file.name}`;
        // public/uploads/assets klasörünün var olduğundan emin ol!
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'assets', uniqueFilename);
        await writeFile(filePath, buffer);
        const dbPath = `/uploads/assets/${uniqueFilename}`;

        // === DÜZELTME: `prisma.asset.create` sorgusunu güncelliyoruz ===
        // Artık tek bir işlemle, projeye bağlı yeni bir asset oluşturuyoruz.
        const newAsset = await prisma.asset.create({
            data: {
                name: file.name,
                path: dbPath,
                type: type,
                // İlişkiyi kurmanın en basit yolu: doğrudan ID'leri vermek.
                projectId: projectId,
                uploadedById: parseInt(session.user.id),
            },
            // İstemcinin state'i güncellemesi için uploader bilgisini de geri döndür.
            include: {
                uploader: { select: { username: true } }
            }
        });

        return NextResponse.json(newAsset, { status: 201 });

    } catch (error) {
        console.error("[CREATE_PROJECT_ASSET_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}