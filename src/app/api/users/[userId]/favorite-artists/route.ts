// src/app/api/users/[userId]/favorite-artists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod'; // Zod importu eklendi

// RouteContext interface'ini kaldırıyoruz.

// Query parametreleri için Zod şeması (limit için)
const getFavoriteArtistsQuerySchema = z.object({
  limit: z.string().optional().default('4').transform(Number), // Varsayılan 4 sanatçı
});

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> } // params'ı Promise olarak al
) {
  const resolvedParams = await params; // params'ı çöz
  const userIdString = resolvedParams.userId;

  if (!userIdString || typeof userIdString !== 'string' || userIdString.trim() === "") {
    return NextResponse.json({ error: 'Eksik veya geçersiz kullanıcı ID parametresi.' }, { status: 400 });
  }
  const userIdInt = parseInt(userIdString, 10);
  if (isNaN(userIdInt)) {
    return NextResponse.json({ error: 'Geçersiz kullanıcı ID formatı.' }, { status: 400 });
  }

  // Query parametrelerini al ve doğrula
  const { searchParams } = new URL(request.url);
  const queryParseResult = getFavoriteArtistsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryParseResult.success) {
    return NextResponse.json({ message: 'Geçersiz sorgu parametreleri.', errors: queryParseResult.error.issues }, { status: 400 });
  }
  const { limit } = queryParseResult.data;

  try {
    const favoriteArtistsRelations = await prisma.dubbingArtistFavorite.findMany({
      where: { userId: userIdInt },
      orderBy: { createdAt: 'desc' },
      take: limit, // Doğrulanmış limit kullanıldı
      select: {
        artist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imagePublicId: true,
            slug: true, // Sanatçı kartı/linki için slug da iyi olabilir
            bio: true, // Kısa bir bio gösterilebilir
            // Örnek: Sanatçının en yaygın rolünü veya toplam proje sayısını da çekebiliriz
            // _count: { select: { assignments: true } },
          }
        }
      }
    });

    const artists = favoriteArtistsRelations.map(fav => fav.artist);

    return NextResponse.json(artists);

  } catch (error) {
    console.error(`API Hatası: Kullanıcı ${userIdInt} favori sanatçıları getirilirken:`, error);
    return NextResponse.json({ error: "Favori sanatçılar getirilirken bir hata oluştu." }, { status: 500 });
  }
}