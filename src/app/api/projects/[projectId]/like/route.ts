// src/app/api/projects/[projectId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions'; // Doğru yolu kontrol et

// Projeyi beğenme (like)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  const projectIdString = resolvedParams.projectId;

  if (!projectIdString) {  return NextResponse.json({ message: 'Eksik proje ID.' }, { status: 400 }); } // Kısaltılmış kontrol
  const projectId = parseInt(projectIdString, 10);
  if (isNaN(projectId)) { return NextResponse.json({ message: 'Geçersiz proje ID.' }, { status: 400 }); }

  const session = await getServerSession(authOptions); // SESSION BURADA
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const userId = parseInt(session.user.id); // USERID BURADA

  try {
    // Kullanıcı bu projeyi daha önce dislike etmiş mi diye kontrol et
    const existingDislike = await prisma.projectDislike.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    const result = await prisma.$transaction(async (tx) => {
      let initialDislikeCountAdjustment = 0;

      // Eğer dislike varsa, önce onu kaldır ve dislikeCount'u azalt
      if (existingDislike) {
        await tx.projectDislike.delete({
          where: { id: existingDislike.id },
        });
        initialDislikeCountAdjustment = -1; // dislikeCount bir azalacak
      }

      // Yeni like ekle
      const newLike = await tx.projectLike.create({
        data: {
          userId,
          projectId,
        },
      });

      // Projenin likeCount'unu artır, dislikeCount'u (eğer değiştiyse) güncelle
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          likeCount: { increment: 1 },
          ...(initialDislikeCountAdjustment !== 0 && { // Sadece dislike kaldırıldıysa dislikeCount'u güncelle
            dislikeCount: { increment: initialDislikeCountAdjustment }
          }),
        },
        select: { likeCount: true, dislikeCount: true }, // Güncel sayıları döndür
      });

      return { newLike, counts: updatedProject };
    });

    return NextResponse.json(
      {
        message: 'Proje beğenildi.',
        like: result.newLike,
        likeCount: result.counts.likeCount,
        dislikeCount: result.counts.dislikeCount, // Dislike kaldırıldıysa bu da güncellenir
      },
      { status: 201 }
    );

  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint (zaten like edilmiş)
      return NextResponse.json({ message: 'Bu proje zaten beğenilmiş.' }, { status: 409 });
    }
    console.error('Like hatası:', error);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}

// Beğeniyi (like) geri alma
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
      // Öncelikle ilgili like kaydını silmemiz gerekiyor.
      // Eğer bu işlem hata verirse (örn. P2025 - Kayıt bulunamadı), zaten işlem başarısız olur.
      const deletedLike = await tx.projectLike.delete({
        where: {
          userId_projectId: { userId, projectId },
        },
      });

      // Ardından projenin likeCount'unu azalt.
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true }, // Sadece güncel like sayısını döndür
      });
      return { deletedLike, counts: updatedProject };
    });
    
    return NextResponse.json(
      {
        message: 'Beğeni geri alındı.',
        likeCount: result.counts.likeCount,
      },
      { status: 200 }
    );

  } catch (error: any){
    if (error.code === 'P2025') { // Kayıt bulunamadı
      return NextResponse.json({ message: 'Kaldırılacak beğeni bulunamadı.' }, { status: 404 });
    }
    console.error('Like geri alma hatası:', error);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}