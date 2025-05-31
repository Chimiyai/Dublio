// src/app/api/artists/[artistId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteParams { params: { artistId: string } }

// Sanatçıyı beğenme / beğeniyi geri alma
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const userId = parseInt(session.user.id);
  const artistId = parseInt(params.artistId);

  if (isNaN(artistId)) {
    return NextResponse.json({ message: 'Geçersiz sanatçı ID.' }, { status: 400 });
  }

  try {
    const existingLike = await prisma.dubbingArtistLike.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    let updatedArtist;
    let newLikeCount;
    let userLiked;

    if (existingLike) {
      await prisma.dubbingArtistLike.delete({ where: { id: existingLike.id } });
      updatedArtist = await prisma.dubbingArtist.update({
        where: { id: artistId },
        data: { likeCount: { decrement: 1 } }, // Atomik operasyon
        // select: { likeCount: true }, // Bu satıra gerek yok, update tüm objeyi döner (veya gerekenleri)
      });
      return NextResponse.json({ 
        message: 'Sanatçı beğenisi kaldırıldı.', 
        likeCount: updatedArtist.likeCount, // Güncellenmiş sayı
        userLiked: false 
      }, { status: 200 });
    } else {
      await prisma.dubbingArtistLike.create({ data: { userId, artistId } });
      updatedArtist = await prisma.dubbingArtist.update({
        where: { id: artistId },
        data: { likeCount: { increment: 1 } }, // Atomik operasyon
      });
      return NextResponse.json({ 
        message: 'Sanatçı beğenildi.', 
        likeCount: updatedArtist.likeCount, 
        userLiked: true 
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Sanatçı like API hatası:', error);
    if (error.code === 'P2025') { // Kayıt bulunamadı (artist silinmiş olabilir)
        return NextResponse.json({ message: 'İşlem yapılacak sanatçı bulunamadı.'}, { status: 404});
    }
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}