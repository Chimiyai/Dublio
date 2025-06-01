// src/app/api/artists/[artistId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// RouteParams interface'ini kaldırıyoruz.
// interface RouteParams { params: { artistId: string } }

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ artistId: string }> } // Tip güncellendi
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const resolvedParams = await params; // params'ı çöz
  const artistIdString = resolvedParams.artistId;
  
  if (!artistIdString || typeof artistIdString !== 'string' || artistIdString.trim() === "") {
    return NextResponse.json({ message: 'Eksik veya geçersiz sanatçı ID parametresi.' }, { status: 400 });
  }
  const userId = parseInt(session.user.id);
  const artistId = parseInt(artistIdString);

  if (isNaN(artistId)) {
    return NextResponse.json({ message: 'Geçersiz sanatçı ID formatı.' }, { status: 400 });
  }

  try {
    const existingLike = await prisma.dubbingArtistLike.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    let updatedArtist;

    if (existingLike) {
      await prisma.dubbingArtistLike.delete({ where: { id: existingLike.id } });
      updatedArtist = await prisma.dubbingArtist.update({
        where: { id: artistId },
        data: { likeCount: { decrement: 1 } },
      });
      return NextResponse.json({ 
        message: 'Sanatçı beğenisi kaldırıldı.', 
        likeCount: updatedArtist.likeCount, 
        userLiked: false 
      }, { status: 200 });
    } else {
      await prisma.dubbingArtistLike.create({ data: { userId, artistId } });
      updatedArtist = await prisma.dubbingArtist.update({
        where: { id: artistId },
        data: { likeCount: { increment: 1 } },
      });
      return NextResponse.json({ 
        message: 'Sanatçı beğenildi.', 
        likeCount: updatedArtist.likeCount, 
        userLiked: true 
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Sanatçı like API hatası:', error);
    if (error.code === 'P2025') {
        return NextResponse.json({ message: 'İşlem yapılacak sanatçı bulunamadı.'}, { status: 404});
    }
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}