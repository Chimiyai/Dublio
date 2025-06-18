// src/app/api/users/[userId]/(actions)/block/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

interface RouteContext { params: { userId: string } }

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> } // <<< İMZAYI GÜNCELLE
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Bu işlemi yapmak için giriş yapmalısınız.' }, { status: 401 });
  }
  
  const resolvedParams = await params; // `await` ile çöz
  const blockingId = parseInt(resolvedParams.userId, 10); // Engellenecek kişi
  const blockerId = parseInt(session.user.id); // Engelleyen kişi
  
  if (isNaN(blockingId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  if (blockerId === blockingId) {
    return NextResponse.json({ message: 'Kendinizi engelleyemezsiniz.' }, { status: 400 });
  }

  try {
    // Kullanıcı zaten engellenmiş mi diye kontrol et
    const existingBlock = await prisma.userBlock.findUnique({
      where: { blockerId_blockingId: { blockerId, blockingId } },
    });

    if (existingBlock) {
      // Eğer zaten engelliyse, engeli kaldır (toggle mantığı)
      await prisma.userBlock.delete({
        where: { blockerId_blockingId: { blockerId, blockingId } },
      });
      return NextResponse.json({ message: 'Kullanıcının engeli kaldırıldı.' });
    } else {
      // Eğer engelli değilse, engelle
      await prisma.userBlock.create({
        data: {
          blockerId,
          blockingId,
        },
      });
      return NextResponse.json({ message: 'Kullanıcı başarıyla engellendi.' });
    }

  } catch (error) {
    console.error("Kullanıcı engelleme/engel kaldırma hatası:", error);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}