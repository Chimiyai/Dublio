// src/app/api/projects/top-favorites/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const topProjects = await prisma.project.findMany({
      where: { isPublished: true }, // Sadece yayınlanmış olanlar
      orderBy: {
        favoriteCount: 'desc', // En çok favorilenene göre sırala
      },
      take: 3, // İlk 3 tanesini al
      select: { // Gerekli alanlar
        id: true,
        title: true,
        slug: true,
        type: true, // "oyun" veya "anime"
        description: true,
        bannerImagePublicId: true, // Üst kart banner'ı için
        coverImagePublicId: true,  // Üst kart kapak resmi için
        releaseDate: true, // Orijinal tasarımda vardı
        // Belki categories de gerekebilir, duruma göre eklenebilir
      }
    });
    return NextResponse.json(topProjects);
  } catch (error) {
    console.error("Error fetching top favorite projects:", error);
    return NextResponse.json({ message: "Top projeler getirilirken bir hata oluştu." }, { status: 500 });
  }
}