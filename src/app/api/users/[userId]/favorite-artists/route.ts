// src/app/api/users/[userId]/favorite-artists/route.ts (Yeni dosya)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: { userId: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const userIdInt = parseInt(params.userId, 10);
  if (isNaN(userIdInt)) {
    return NextResponse.json({ error: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '4', 10); // Varsayılan 4 sanatçı

  try {
    const favoriteArtistsRelations = await prisma.dubbingArtistFavorite.findMany({
      where: { userId: userIdInt },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        artist: { // Favorilenen sanatçının bilgilerini çek
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imagePublicId: true,
            bio: true,
            // assignments: { select: { role: true } } // En bilinen rolü de alınabilir
          }
        }
      }
    });

    const artists = favoriteArtistsRelations.map(fav => fav.artist);

    return NextResponse.json(artists);

  } catch (error) {
    console.error(`API Error for user ${userIdInt} favorite artists:`, error);
    return NextResponse.json({ error: "Favori sanatçılar getirilirken bir hata oluştu." }, { status: 500 });
  }
}