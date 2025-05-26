// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Prisma tiplerini import et

// Prisma'dan dönen proje için bir tip (API'den dönen veri yapısıyla eşleşmeli)
interface PrismaCategory {
  id: number; // Şemanızda Int, bu yüzden number olmalı
  name: string;
  slug: string;
}

interface ApiProjectResponseItem { // Dönen son veri yapısı için tip
  id: number; // Şemanızda Int
  slug: string;
  title: string;
  type: string;
  bannerImagePublicId: string | null;
  coverImagePublicId: string | null;
  description: string | null;
  releaseDate: Date | null;
  createdAt: Date;
  likeCount: number; // Sayısal değerler
  dislikeCount: number;
  favoriteCount: number;
  // viewCount?: number; // Gerekirse
  // averageRating?: number; // Gerekirse
  categories: PrismaCategory[]; // Sadece kategori bilgilerini içeren bir dizi
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  console.log(`CLIENT API /api/projects GET. URL: ${request.url}`);

  const limitParam = searchParams.get('limit');
  const typeFilter = searchParams.get('type')?.toLowerCase();
  const categoryFilter = searchParams.get('category');
  const sortByParam = searchParams.get('sortBy');
  const titleContainsQuery = searchParams.get('title_contains')?.trim();

  let take: number | undefined = undefined;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0) take = parsed;
  }

  // orderBy için Prisma tipini kullanalım
  let orderBy: Prisma.ProjectOrderByWithRelationInput | Prisma.ProjectOrderByWithRelationInput[] = [{ createdAt: 'desc' }];

  if (sortByParam) {
    console.log(`API orderByParam received: ${sortByParam}`);
    if (sortByParam === 'popular') {
      orderBy = [
        { favoriteCount: 'desc' }, // Şemanızdaki doğru alan adı
        { likeCount: 'desc' },     // Şemanızdaki doğru alan adı
        { viewCount: 'desc' },     // Şemanızdaki doğru alan adı
        { createdAt: 'desc' },
      ];
    } else if (sortByParam === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sortByParam === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortByParam === 'likes') {
      orderBy = { likeCount: 'desc' }; // Şemanızdaki doğru alan adı
    } else if (sortByParam === 'titleAsc') {
      orderBy = { title: 'asc' };
    } else if (sortByParam === 'titleDesc') {
      orderBy = { title: 'desc' };
    }
  }

  // where için Prisma tipini kullanalım
  const where: Prisma.ProjectWhereInput = {
    isPublished: true,
  };

  if (typeFilter === 'oyun' || typeFilter === 'anime') {
    // VERİTABANINIZDAKİ 'type' ALANININ DEĞERİYLE EŞLEŞTİĞİNDEN EMİN OLUN
    // Örn: 'oyun' veya 'Oyun'
    where.type = typeFilter;
  }

  if (categoryFilter && categoryFilter !== 'all') {
    where.categories = { some: { category: { slug: categoryFilter } } };
  }

  if (titleContainsQuery) {
    where.title = { contains: titleContainsQuery };
    // SQLite için 'insensitive' mode doğrudan desteklenmeyebilir.
    // Eğer sorun olursa, LOWER() kullanmanız veya Prisma'nın farklı bir çözümünü aramanız gerekebilir.
    // Veya client tarafında filtreleme yapabilirsiniz.
  }

  console.log('CLIENT API Prisma Query:', { where, orderBy, take });

  try {
    // Prisma'dan dönecek tipin ne olacağını biliyoruz, bu yüzden direkt kullanalım.
    // Ancak `select` kullandığımız için Prisma tam tipi otomatik çıkaramayabilir, bu yüzden `any` kullanıp sonra map'leyebiliriz.
    const projectsFromDB: any[] = await prisma.project.findMany({
      where,
      orderBy,
      take: take || undefined,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        bannerImagePublicId: true,
        coverImagePublicId: true,
        description: true,
        releaseDate: true,
        createdAt: true,
        likeCount: true,      // DOĞRU ALAN ADI
        dislikeCount: true,   // DOĞRU ALAN ADI
        favoriteCount: true,  // DOĞRU ALAN ADI
        viewCount: true,      // Eğer kullanacaksanız
        averageRating: true,  // Eğer kullanacaksanız
        categories: {
          select: {
            category: { // ProjectCategory -> category ilişkisi
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    });

    // Client'a göndereceğimiz son format
    const responseProjects: ApiProjectResponseItem[] = projectsFromDB.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      type: p.type,
      bannerImagePublicId: p.bannerImagePublicId,
      coverImagePublicId: p.coverImagePublicId,
      description: p.description,
      releaseDate: p.releaseDate,
      createdAt: p.createdAt,
      likeCount: p.likeCount ?? 0,
      dislikeCount: p.dislikeCount ?? 0,
      favoriteCount: p.favoriteCount ?? 0,
      // viewCount: p.viewCount ?? 0, // Gerekirse
      // averageRating: p.averageRating ?? 0, // Gerekirse
      categories: p.categories.map((catRelation: any) => catRelation.category), // Sadece Category objelerini al
    }));

    console.log(`CLIENT API Successfully fetched ${responseProjects.length} projects.`);
    return NextResponse.json(responseProjects);

  } catch (error) {
    console.error("CLIENT API Error in /api/projects GET:", error);
    let errorMessage = "Projeler getirilirken bir sunucu hatası oluştu.";
    if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error details:", { name: error.name, message: error.message, stack: error.stack?.substring(0, 300) });
         if ('code' in error) { // Prisma errors often have a code
            console.error("Prisma Error Code:", (error as any).code);
            if ('meta' in error) console.error("Prisma Error Meta:", (error as any).meta);
        }
    }
    return NextResponse.json(
      { message: "Projeler getirilirken bir hata oluştu.", details: errorMessage },
      { status: 500 }
    );
  }
}