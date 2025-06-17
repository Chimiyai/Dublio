// src/app/api/users/[userId]/library/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(
  request: NextRequest,
  // --- DÜZELTME BURADA ---
  // Parametre tipini, diğer çalışan rotalardaki gibi Promise'li hale getiriyoruz.
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // `params` bir Promise olduğu için `await` ile çözülmeli
  const resolvedParams = await params;
  const targetUserIdString = resolvedParams.userId;
  
  const targetUserId = parseInt(targetUserIdString, 10);

  if (isNaN(targetUserId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  // session.user.id bir string olduğu için, karşılaştırma yaparken
  // number'a çevrilmiş targetUserId yerine string olan targetUserIdString'i kullanalım.
  if (!session || session.user.id !== targetUserIdString) {
    return NextResponse.json({ libraryItems: [] });
  }

  try {
    const ownedGames = await prisma.userOwnedGame.findMany({
      where: {
        userId: targetUserId, // Burada number'a çevrilmiş hali kullanılmalı
      },
      orderBy: {
        purchasedAt: 'desc',
      },
      include: {
        project: {
          select: {
            id: true,
            slug: true,
            title: true,
            type: true,
            coverImagePublicId: true,
            bannerImagePublicId: true,
            description: true,
            releaseDate: true,
            dislikeCount: true,
            favoriteCount: true,
            likeCount: true,
            averageRating: true,
          }
        }
      }
    });
    
    const libraryItems = ownedGames
        .filter(item => item.project.type === 'oyun')
        .map(item => item.project);

    return NextResponse.json({ libraryItems });

  } catch (error) {
    console.error(`Kütüphane verisi çekilirken hata (userId: ${targetUserId}):`, error);
    return NextResponse.json({ message: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}