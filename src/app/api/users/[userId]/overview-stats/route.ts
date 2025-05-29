// src/app/api/users/[userId]/overview-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Prisma tiplerini import etmeye gerek yok eğer doğrudan kullanmıyorsak,
// Prisma Client zaten tipleri biliyor.

interface RouteContext {
  params: {
    userId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const userIdInt = parseInt(params.userId, 10);

  if (isNaN(userIdInt)) {
    return NextResponse.json({ error: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  // overview-stats için limit parametresine ihtiyacımız yok,
  // çünkü top 5 kategori ve son 4 sanatçı gibi sabit sayılar alıyoruz.
  // Eğer favori sanatçı sayısını dinamik yapmak isterseniz, o zaman limit alabilirsiniz.
  // const { searchParams } = new URL(request.url);
  // const favoriteArtistLimit = parseInt(searchParams.get('favoriteArtistLimit') || '4', 10);

  console.log(`API /api/users/${userIdInt}/overview-stats GET request received`);

  try {
    // Kategori bazlı etkileşimler
    const userInteractions = await prisma.user.findUnique({
      where: { id: userIdInt },
      select: {
        projectLikes: {
          select: { project: { select: { id: true, slug: true, type: true, categories: { select: { category: { select: { name: true, slug: true } } } } } } }
        },
        projectFavorites: {
          select: { project: { select: { id: true, slug: true, type: true, categories: { select: { category: { select: { name: true, slug: true } } } } } } }
        },
      }
    });

    if (!userInteractions) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    const categoryScores: { 
      [type: string]: { 
        [categorySlug: string]: { name: string; slug: string; score: number; projectCount: Set<string> } 
      } 
    } = {
      oyun: {},
      anime: {}
    };

    const countInteraction = (project: any, scoreIncrement: number) => {
      if (!project || !project.type || !project.categories || project.categories.length === 0) return;
      const typeKey = project.type.toString().toLowerCase() === 'oyun' ? 'oyun' : project.type.toString().toLowerCase() === 'anime' ? 'anime' : null;
      if (!typeKey) return;

      project.categories.forEach((pc: any) => {
        if (pc.category && pc.category.slug && pc.category.name) {
          const cat = pc.category;
          if (!categoryScores[typeKey][cat.slug]) {
            categoryScores[typeKey][cat.slug] = { name: cat.name, slug: cat.slug, score: 0, projectCount: new Set() };
          }
          categoryScores[typeKey][cat.slug].score += scoreIncrement;
          if (project.id) categoryScores[typeKey][cat.slug].projectCount.add(project.id.toString());
        }
      });
    };

    userInteractions.projectLikes.forEach(like => countInteraction(like.project, 1));
    userInteractions.projectFavorites.forEach(fav => countInteraction(fav.project, 2));

    const topGameCategories = Object.values(categoryScores.oyun)
      .map(stat => ({ ...stat, projectCount: stat.projectCount.size, type: 'oyun' as const }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const topAnimeCategories = Object.values(categoryScores.anime)
      .map(stat => ({ ...stat, projectCount: stat.projectCount.size, type: 'anime' as const }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Genel istatistikler
    const totalLikes = await prisma.projectLike.count({ where: { userId: userIdInt } });
    const totalFavorites = await prisma.projectFavorite.count({ where: { userId: userIdInt } });
    const totalComments = await prisma.comment.count({ where: { userId: userIdInt } }); // Comment modeliniz olduğunu varsayıyoruz

    // Favori Sanatçılar (Bu kısım overviewData'nın bir parçası olmalı)
    const favoriteArtistLimit = 4; // Sabit bir limit veya URL'den alınabilir
    const favoriteArtistsRelations = await prisma.dubbingArtistFavorite.findMany({
      where: { userId: userIdInt },
      orderBy: { createdAt: 'desc' },
      take: favoriteArtistLimit, // Tanımlı limiti kullan
      select: {
        artist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imagePublicId: true,
            bio: true,
          }
        }
      }
    });
    const favoriteArtists = favoriteArtistsRelations.map(fav => fav.artist);
    console.log(`User ${userIdInt} - Fetched Favorite Artists:`, JSON.stringify(favoriteArtists, null, 2));


    // Tüm veriyi tek bir objede topla
    const overviewData = {
      gameCategoryStats: topGameCategories.map(s => ({ 
        categoryName: s.name, 
        categorySlug: s.slug, // <<<< SLUG EKLENDİ
        projectCount: s.projectCount, 
        interactionScore: s.score, 
        type: s.type 
      })),
      animeCategoryStats: topAnimeCategories.map(s => ({ 
        categoryName: s.name, 
        categorySlug: s.slug, // <<<< SLUG EKLENDİ
        projectCount: s.projectCount, 
        interactionScore: s.score, 
        type: s.type 
      })),
      generalStats: {
        totalLikes,
        totalFavorites,
        totalComments,
      },
      favoriteArtists: favoriteArtists, // Favori sanatçıları da ekle
    };

    console.log("Overview data prepared:", JSON.stringify(overviewData, null, 2));
    return NextResponse.json(overviewData);

  } catch (error) {
    console.error(`API Error for user ${userIdInt} overview-stats:`, error);
    let errorMessage = "Genel bakış istatistikleri getirilirken bir sunucu hatası oluştu.";
    if (error instanceof Error) {
        errorMessage = error.message;
        // ... (daha detaylı hata loglama)
    }
    return NextResponse.json({ error: "Genel bakış istatistikleri getirilirken bir hata oluştu.", details: errorMessage }, { status: 500 });
  }
}