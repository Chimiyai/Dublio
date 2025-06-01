// src/app/api/users/[userId]/overview-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Prisma tiplerini import etmeye gerek yok eğer doğrudan kullanmıyorsak

// RouteContext interface'ini kaldırıyoruz.
// interface RouteContext {
//   params: {
//     userId: string;
//   };
// }

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
    const totalComments = await prisma.comment.count({ where: { userId: userIdInt } });

    // Favori Sanatçılar
    const favoriteArtistLimit = 4;
    const favoriteArtistsRelations = await prisma.dubbingArtistFavorite.findMany({
      where: { userId: userIdInt },
      orderBy: { createdAt: 'desc' },
      take: favoriteArtistLimit,
      select: {
        artist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imagePublicId: true,
            slug: true, // Slug eklendi
            // bio: true, // Bio burada gerekmeyebilir, kartta gösterilecekse
          }
        }
      }
    });
    const favoriteArtists = favoriteArtistsRelations.map(fav => fav.artist);
    
    const overviewData = {
      gameCategoryStats: topGameCategories.map(s => ({ 
        categoryName: s.name, 
        categorySlug: s.slug,
        projectCount: s.projectCount, 
        interactionScore: s.score, 
        type: s.type 
      })),
      animeCategoryStats: topAnimeCategories.map(s => ({ 
        categoryName: s.name, 
        categorySlug: s.slug,
        projectCount: s.projectCount, 
        interactionScore: s.score, 
        type: s.type 
      })),
      generalStats: {
        totalLikes,
        totalFavorites,
        totalComments,
      },
      favoriteArtists: favoriteArtists,
    };

    // console.log("Overview data prepared:", JSON.stringify(overviewData, null, 2)); // Debug için
    return NextResponse.json(overviewData);

  } catch (error) {
    console.error(`API Hatası: Kullanıcı ${userIdInt} genel bakış istatistikleri getirilirken:`, error);
    let errorMessage = "Genel bakış istatistikleri getirilirken bir sunucu hatası oluştu.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: "Genel bakış istatistikleri getirilirken bir hata oluştu.", details: errorMessage }, { status: 500 });
  }
}