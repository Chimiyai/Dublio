// src/app/api/stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ContentType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const [totalUsers, totalGames, totalAnimes] = await Promise.all([
      prisma.user.count(),
      // Artık sayımı Content tablosundan yapıyoruz
      prisma.content.count({ where: { type: ContentType.GAME } }),
      prisma.content.count({ where: { type: ContentType.ANIME } })
    ]);
    return NextResponse.json({ totalUsers, totalDubbedGames: totalGames, totalDubbedAnimes: totalAnimes });
  } catch (error) {
    console.error("API /api/stats GET Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}