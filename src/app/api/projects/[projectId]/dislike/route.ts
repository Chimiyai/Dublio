// src/app/api/projects/[projectId]/dislike/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Projeyi beğenmeme (dislike)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectIdString = resolvedParams.projectId;

  if (!projectIdString) { return NextResponse.json({ message: 'Eksik proje ID.' }, { status: 400 }); }
  const projectId = parseInt(projectIdString, 10);
  if (isNaN(projectId)) { return NextResponse.json({ message: 'Geçersiz proje ID.' }, { status: 400 }); }

  const session = await getServerSession(authOptions); // SESSION BURADA
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const userId = parseInt(session.user.id); // USERID BURADA

  try {
    // Kullanıcı bu projeyi daha önce like etmiş mi diye kontrol et
    const existingLike = await prisma.projectLike.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    const result = await prisma.$transaction(async (tx) => {
      // Eğer like varsa, önce onu kaldır ve likeCount'u azalt
      if (existingLike) {
        await tx.projectLike.delete({
          where: { id: existingLike.id },
        });
        await tx.project.update({
          where: { id: projectId },
          data: { likeCount: { decrement: 1 } },
        });
      }

      // Yeni dislike ekle ve dislikeCount'u artır
      const newDislike = await tx.projectDislike.create({
        data: {
          userId,
          projectId,
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { dislikeCount: { increment: 1 } },
        select: { likeCount: true, dislikeCount: true }, // Güncel sayıları döndür
      });

      return { newDislike, counts: updatedProject };
    });

    return NextResponse.json(
      {
        message: 'Proje beğenilmedi olarak işaretlendi.',
        dislike: result.newDislike,
        likeCount: result.counts.likeCount, // Like kaldırıldıysa bu da güncellenir
        dislikeCount: result.counts.dislikeCount,
      },
      { status: 201 }
    );

  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint (zaten dislike edilmiş)
      return NextResponse.json({ message: 'Bu proje zaten beğenilmedi olarak işaretlenmiş.' }, { status: 409 });
    }
    console.error('Dislike hatası:', error);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}

// Beğenmemeyi (dislike) geri alma
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectIdString = resolvedParams.projectId;

  if (!projectIdString) { return NextResponse.json({ message: 'Eksik proje ID.' }, { status: 400 }); }
  const projectId = parseInt(projectIdString, 10);
  if (isNaN(projectId)) { return NextResponse.json({ message: 'Geçersiz proje ID.' }, { status: 400 }); }

  const session = await getServerSession(authOptions); // SESSION BURADA
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const userId = parseInt(session.user.id); // USERID BURADA

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deletedDislike = await tx.projectDislike.delete({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { dislikeCount: { decrement: 1 } },
        select: { dislikeCount: true },
      });
      return { deletedDislike, counts: updatedProject };
    });
    
    return NextResponse.json(
      {
        message: 'Beğenmeme durumu geri alındı.',
        dislikeCount: result.counts.dislikeCount,
      },
      { status: 200 }
    );

  } catch (error: any) {
    if (error.code === 'P2025') { // Kayıt bulunamadı
      return NextResponse.json({ message: 'Kaldırılacak beğenmeme durumu bulunamadı.' }, { status: 404 });
    }
    console.error('Dislike geri alma hatası:', error);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}