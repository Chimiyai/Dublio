// src/app/api/artists/[artistId]/favorite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteParams { params: { artistId: string } }

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
    const existingFavorite = await prisma.dubbingArtistFavorite.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    let updatedArtist;
    let newFavoriteCount;
    let userFavorited;

    if (existingFavorite) {
      await prisma.dubbingArtistFavorite.delete({ where: { id: existingFavorite.id } });
      updatedArtist = await prisma.dubbingArtist.update({
        where: { id: artistId },
        data: { favoriteCount: { decrement: 1 } }, // Atomik operasyon
      });
      return NextResponse.json({ 
        message: 'Sanatçı favorilerden çıkarıldı.', 
        favoriteCount: updatedArtist.favoriteCount, // Güncellenmiş sayı
        userFavorited: false 
      }, { status: 200 });
    } else {
      await prisma.dubbingArtistFavorite.create({ data: { userId, artistId } });
      updatedArtist = await prisma.dubbingArtist.update({
        where: { id: artistId },
        data: { favoriteCount: { increment: 1 } }, // Atomik operasyon
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