// src/app/api/users/[userId]/(actions)/block/route.ts (GÜNCELLENMİŞ HALİ)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// params için tipi doğrudan burada tanımlayabiliriz
export async function POST(
  request: NextRequest, 
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Bu işlemi yapmak için giriş yapmalısınız.' }, { status: 401 });
  }
  
  const blockingId = parseInt(params.userId, 10); // Engellenecek kişi
  const blockerId = parseInt(session.user.id, 10); // Engelleyen kişi
  
  if (isNaN(blockingId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  if (blockerId === blockingId) {
    return NextResponse.json({ message: 'Kendinizi engelleyemezsiniz.' }, { status: 400 });
  }

  try {
    const existingBlock = await prisma.userBlock.findUnique({
      where: { blockerId_blockingId: { blockerId, blockingId } },
    });

    if (existingBlock) {
      // Zaten engelliyse, engeli KALDIR
      await prisma.userBlock.delete({
        where: { blockerId_blockingId: { blockerId, blockingId } },
      });
      return NextResponse.json({ message: 'Kullanıcının engeli kaldırıldı.' });
    } else {
      // Engelli değilse, ENGELLE
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