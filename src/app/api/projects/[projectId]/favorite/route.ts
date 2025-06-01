// src/app/api/projects/[projectId]/favorite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Projeyi favorilere ekleme
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectIdString = resolvedParams.projectId;

  if (!projectIdString) {
    return NextResponse.json({ message: 'Eksik proje ID parametresi.' }, { status: 400 });
  }
  const projectId = parseInt(projectIdString, 10);
  if (isNaN(projectId)) {
    return NextResponse.json({ message: 'Geçersiz proje ID formatı.' }, { status: 400 });
  }

  const session = await getServerSession(authOptions); // SESSION BURADA ALINMALI
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const userId = parseInt(session.user.id); // USERID BURADA TANIMLANMALI

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newFavorite = await tx.projectFavorite.create({
        data: {
          userId,
          projectId,
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { favoriteCount: { increment: 1 } },
        select: { favoriteCount: true }, // Sadece güncel favori sayısını döndür
      });

      return { newFavorite, counts: updatedProject };
    });

    return NextResponse.json(
      {
        message: 'Proje favorilere eklendi.',
        favorite: result.newFavorite,
        favoriteCount: result.counts.favoriteCount,
      },
      { status: 201 }
    );

  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint (zaten favorilenmiş)
      return NextResponse.json({ message: 'Bu proje zaten favorilerinizde.' }, { status: 409 });
    }
    console.error('Favorilere ekleme hatası:', error);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}

// Projeyi favorilerden çıkarma
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectIdString = resolvedParams.projectId;

  if (!projectIdString) {
     return NextResponse.json({ message: 'Eksik proje ID parametresi.' }, { status: 400 });
  }
  const projectId = parseInt(projectIdString, 10);
  if (isNaN(projectId)) {
    return NextResponse.json({ message: 'Geçersiz proje ID formatı.' }, { status: 400 });
  }

  const session = await getServerSession(authOptions); // SESSION BURADA ALINMALI
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const userId = parseInt(session.user.id); // USERID BURADA TANIMLANMALI

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deletedFavorite = await tx.projectFavorite.delete({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { favoriteCount: { decrement: 1 } },
        select: { favoriteCount: true },
      });
      return { deletedFavorite, counts: updatedProject };
    });
    
    return NextResponse.json(
      {
        message: 'Proje favorilerden çıkarıldı.',
        favoriteCount: result.counts.favoriteCount,
      },
      { status: 200 }
    );

  } catch (error: any) {
    if (error.code === 'P2025') { // Kayıt bulunamadı
      return NextResponse.json({ message: 'Favorilerden çıkarılacak proje bulunamadı.' }, { status: 404 });
    }
    console.error('Favorilerden çıkarma hatası:', error);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}