// src/app/api/projects/[projectId]/favorite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  params: { projectId: string };
}

// Projeyi favorilere ekleme
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const projectId = parseInt(params.projectId);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: 'Geçersiz proje ID.' }, { status: 400 });
  }

  try {
    // Favorite işlemi like/dislike durumunu etkilemez, bu yüzden direkt işlem yapılır.
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
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const projectId = parseInt(params.projectId);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: 'Geçersiz proje ID.' }, { status: 400 });
  }

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