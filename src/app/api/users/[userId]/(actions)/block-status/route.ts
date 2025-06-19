// src/app/api/users/[userId]/block-status/route.ts (DOĞRU VE GÜNCEL HALİ)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> } // <<< TİPİ DÜZELTTİK
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ isBlocked: false });
  }

  const resolvedParams = await params; // Promise'i çözüyoruz
  const blockingId = parseInt(resolvedParams.userId, 10);
  const blockerId = parseInt(session.user.id, 10);
  
  if (isNaN(blockingId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  if (blockerId === blockingId) {
    return NextResponse.json({ isBlocked: false });
  }

  try {
    const blockRecord = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockingId: {
          blockerId,
          blockingId,
        },
      },
    });

    return NextResponse.json({ isBlocked: !!blockRecord });

  } catch (error) {
    console.error("Engel durumu sorgulama hatası:", error);
    return NextResponse.json({ message: "Engel durumu sorgulanırken bir hata oluştu.", isBlocked: false }, { status: 500 });
  }
}