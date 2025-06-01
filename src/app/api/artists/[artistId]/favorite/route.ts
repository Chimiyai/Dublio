// src/app/api/artists/[artistId]/favorite/route.ts
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
    const existingFavorite = await prisma.dubbingArtistFavorite.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    let updatedArtist;

    if (existingFavorite) {
      await prisma.dubbingArtistFavorite.delete({
        where: { id: existingFavorite.id },
      });
      updatedArtist = await prisma.dubbingArtist.update({
        where: { id: artistId },
        data: { favoriteCount: { decrement: 1 } },
      });
      return NextResponse.json({ 
        message: 'Sanatçı favorilerden çıkarıldı.', 
        favoriteCount: updatedArtist.favoriteCount, 
        userFavorited: false 
      }, { status: 200 });
    } else {
      await prisma.dubbingArtistFavorite.create({
        data: { userId, artistId },
      });
      updatedArtist = await prisma.dubbingArtist.update({
        where: { id: artistId },
        data: { favoriteCount: { increment: 1 } },
      });
      return NextResponse.json({ 
        message: 'Sanatçı favorilere eklendi.', 
        favoriteCount: updatedArtist.favoriteCount, 
        userFavorited: true 
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Sanatçı favori API hatası:', error);
     if (error.code === 'P2025') {
        return NextResponse.json({ message: 'İşlem yapılacak sanatçı bulunamadı.'}, { status: 404});
    }
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}