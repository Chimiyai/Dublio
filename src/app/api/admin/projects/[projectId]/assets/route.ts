//src/app/api/admin/projects/[projectId]/assets/route.ts
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
    if (session?.user?.role !== 'ADMIN') {
      return new NextResponse('Yetkisiz', { status: 403 });
    }
    const uploaderId = parseInt(session.user.id, 10);
    const projectId = parseInt(params.projectId, 10);

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const assetType: AssetType = (data.get('type') as AssetType) || AssetType.OTHER;

    if (!file || !projectId) {
      return new NextResponse('Eksik bilgi: dosya veya proje ID', { status: 400 });
    }

    // Dosyayı lokal diske kaydet
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    await writeFile(filepath, buffer);
    const publicPath = `/uploads/${filename}`;

    // Veritabanına asset kaydını oluştur
    const newAsset = await prisma.asset.create({
      data: {
        projectId: projectId,
        name: file.name,
        path: publicPath,
        type: assetType,
        uploadedById: uploaderId,
      },
      // Bu include, geri dönen `newAsset` objesinin içinde
      // `uploader: { username: '...' }` objesinin de olmasını sağlar.
      include: {
        uploader: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json(newAsset, { status: 201 });

  } catch (error) {
    console.error("[ASSET_UPLOAD_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}
