// src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ContentType } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type'); // 'oyun' veya 'anime'
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  // Gelen parametreye göre ContentType enum'ını belirle
  let contentType: ContentType | undefined;
  if (typeParam === 'oyun') contentType = ContentType.GAME;
  if (typeParam === 'anime') contentType = ContentType.ANIME;

  try {
    const projects = await prisma.project.findMany({
      where: {
        isPublic: true, // Bu alan Project modelimizde var
        content: { // Artık filtrelemeyi ilişkili Content modeli üzerinden yapıyoruz
          type: contentType
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        content: true, // Tüm content detaylarını al
        team: { select: { name: true, slug: true } } // Ekip detaylarını al
      }
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("API /api/projects GET Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}