// src/app/api/animeler/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Zod şeması (oyunlarla aynı)
const getProjectsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  q: z.string().optional(),
  categories: z.string().optional().transform((val) => val ? val.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : undefined),
  sortBy: z.enum(['releaseDate', 'createdAt', 'title', 'likeCount', 'favoriteCount']).optional().default('releaseDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParseResult = getProjectsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryParseResult.success) {
    return NextResponse.json({ message: 'Geçersiz sorgu parametreleri.', errors: queryParseResult.error.issues }, { status: 400 });
  }

  const { page, limit, q: searchTerm, categories: categoryIds, sortBy, sortOrder } = queryParseResult.data;
  const skip = (page - 1) * limit;

  console.log("API /animeler - Gelen Filtreler:", { page, limit, searchTerm, categoryIds, sortBy, sortOrder });

  const where: Prisma.ProjectWhereInput = {
    isPublished: true,
    type: 'anime', // <<== TEMEL FARK BURADA
  };

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm /*, mode: 'insensitive' */ } },
      { description: { contains: searchTerm /*, mode: 'insensitive' */ } },
    ];
  }

  if (categoryIds && categoryIds.length > 0) {
    where.categories = {
      some: {
        categoryId: {
          in: categoryIds,
        },
      },
    };
  }
  // console.log("API /animeler - Where Koşulu:", JSON.stringify(where));


  const orderBy: Prisma.ProjectOrderByWithRelationInput = {};
  if (sortBy === 'title') orderBy.title = sortOrder;
  else if (sortBy === 'likeCount') orderBy.likeCount = sortOrder;
  else if (sortBy === 'favoriteCount') orderBy.favoriteCount = sortOrder;
  else orderBy[sortBy || 'releaseDate'] = sortOrder;
  // console.log("API /animeler - OrderBy Koşulu:", JSON.stringify(orderBy));


  try {
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: { // Oyunlar sayfasıyla aynı select yapısı
        id: true,
        title: true,
        slug: true,
        type: true,
        coverImagePublicId: true,
        bannerImagePublicId: true,
        description: true,
        releaseDate: true,
        likeCount: true,
        dislikeCount: true,
        favoriteCount: true,
        _count: { select: { comments: true } },
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
    console.error('Animeleri getirme API hatası:', error);
    return NextResponse.json({ message: error.message || 'Animeler getirilirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}