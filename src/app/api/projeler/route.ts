// src/app/api/projeler/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const getProjectsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  q: z.string().optional(),
  type: z.enum(['oyun', 'anime']).optional(),
  categories: z.string().optional().transform((val) => val ? val.split(',').map(slug => slug.trim()).filter(slug => slug.length > 0) : undefined),
  sortBy: z.enum(['releaseDate', 'createdAt', 'title', 'likeCount', 'favoriteCount', 'averageRating', 'viewCount']).optional().default('releaseDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParseResult = getProjectsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryParseResult.success) {
    console.error("API /projeler - Zod Validation Error:", queryParseResult.error.flatten().fieldErrors);
    return NextResponse.json({ message: 'Geçersiz sorgu parametreleri.', errors: queryParseResult.error.issues }, { status: 400 });
  }

  // sortBy ve sortOrder'ı buradan çıkar
  const { 
    page, 
    limit, 
    q: searchTerm, 
    type: projectType, 
    categories: categorySlugsFromQuery,
    sortBy, // <<< YENİ EKLENDİ
    sortOrder // <<< YENİ EKLENDİ
  } = queryParseResult.data;

  // console.log("API /projeler: Alınan Kategori Slug'ları:", categorySlugsFromQuery);
  // console.log("API /projeler: Alınan Sıralama:", { sortBy, sortOrder });
  const skip = (page - 1) * limit;

  const where: Prisma.ProjectWhereInput = {
    isPublished: true,
  };

  if (projectType) {
    where.type = projectType;
  }

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm /*, mode: 'insensitive' */ } },
      { description: { contains: searchTerm /*, mode: 'insensitive' */ } },
    ];
  }

  if (categorySlugsFromQuery && categorySlugsFromQuery.length > 0) {
    where.categories = {
      some: {
        category: {
          slug: {
            in: categorySlugsFromQuery,
          },
        },
      },
    };
    // console.log("API /projeler: Kategori için WHERE koşulu:", where.categories);
  }
  
  // categoryIds ile ilgili olan bu blok mükerrer ve hatalı, yukarıda categorySlugsFromQuery ile zaten hallediliyor.
  // BU BLOĞU SİLİN:
  /*
  if (categoryIds && categoryIds.length > 0) { // categoryIds diye bir değişken yok artık
    where.categories = {
      some: {
        categoryId: { // Eğer ID ile filtrelemek isterseniz Zod'u ve client'ı ona göre ayarlamanız gerekir.
          in: categoryIds,
        },
      },
    };
  }
  */

  const orderBy: Prisma.ProjectOrderByWithRelationInput = {};
  // sortBy'ın string olduğunu ve Prisma.ProjectOrderByWithRelationInput'un geçerli bir key'i olduğunu varsayıyoruz.
  // Zod zaten geçerli değerleri kontrol ediyor.
  if (sortBy && sortOrder) { // sortBy ve sortOrder'ın varlığını kontrol et
    if (['releaseDate', 'createdAt', 'title', 'likeCount', 'favoriteCount', 'averageRating', 'viewCount'].includes(sortBy)) {
      (orderBy as any)[sortBy] = sortOrder; // Tip zorlaması (any) veya daha güvenli bir atama
    } else {
      // Varsayılan sıralama (Zod zaten default atıyor ama yine de bir fallback olabilir)
      orderBy.releaseDate = 'desc';
    }
  } else {
    orderBy.releaseDate = 'desc'; // sortBy veya sortOrder yoksa varsayılan
  }
  // console.log("API /projeler: OrderBy Koşulu:", orderBy);

  try {
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        coverImagePublicId: true,
        bannerImagePublicId: true,
        description: true,
        releaseDate: true,
        averageRating: true,
        viewCount: true,
        price: true,
        currency: true,
        _count: { select: { comments: true, ratings: true } },
        categories: { select: { category: { select: { name: true, slug: true } } } },
        likeCount: true,
        dislikeCount: true,
        favoriteCount: true,
      },
    });

    const totalProjects = await prisma.project.count({ where });

    return NextResponse.json({
      projects,
      totalPages: Math.ceil(totalProjects / limit),
      currentPage: page,
      totalResults: totalProjects,
    });

  } catch (error: any) {
    console.error('Projeleri getirme API hatası (/api/projeler):', error);
    return NextResponse.json({ message: error.message || 'Projeler getirilirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}