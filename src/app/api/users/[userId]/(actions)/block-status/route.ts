// src/app/api/users/[userId]/block-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(
  request: NextRequest, 
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Eğer kullanıcı giriş yapmamışsa, engelleme durumu olamaz.
  if (!session?.user?.id) {
    return NextResponse.json({ isBlocked: false });
  }

  const blockingId = parseInt(params.userId, 10); // Durumu sorgulanan profil sahibi
  const blockerId = parseInt(session.user.id, 10); // Şu anki giriş yapmış kullanıcı
  
  if (isNaN(blockingId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  // Kendini engelleme durumu olamaz, her zaman false dön.
  if (blockerId === blockingId) {
    return NextResponse.json({ isBlocked: false });
  }

  try {
    // Veritabanında bu engelleme kaydı var mı diye kontrol et.
    const blockRecord = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockingId: {
          blockerId: blockerId,
          blockingId: blockingId,
        },
      },
    });

    // Eğer kayıt varsa `isBlocked: true`, yoksa `isBlocked: false` dön.
    return NextResponse.json({ isBlocked: !!blockRecord });

  } catch (error) {
    console.error("Engel durumu sorgulama hatası:", error);
    // Hata durumunda, güvenlik için engelli değil varsayalım.
    return NextResponse.json({ message: "Engel durumu sorgulanırken bir hata oluştu.", isBlocked: false }, { status: 500 });
  }
}