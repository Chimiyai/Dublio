// src/app/api/messages/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: {
    userId: string; // URL'den gelen partnerin ID'si
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const currentUserId = parseInt(session.user.id, 10);
  const partnerId = parseInt(params.userId, 10);

  if (isNaN(currentUserId) || isNaN(partnerId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı IDleri.' }, { status: 400 });
  }

  if (currentUserId === partnerId) {
    return NextResponse.json({ message: 'Kendinizle olan mesajları bu şekilde getiremezsiniz.' }, { status: 400 });
  }

  try {
    // İki kullanıcı arasındaki tüm mesajları çek
    // Gönderen ben, alıcı partner VEYA gönderen partner, alıcı ben
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: partnerId },
          { senderId: partnerId, receiverId: currentUserId },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, profileImagePublicId: true } },
        // receiver'a genellikle gerek yok çünkü kiminle konuştuğumuzu zaten biliyoruz (partnerId)
        // ama istersen eklenebilir.
      },
      orderBy: {
        createdAt: 'asc', // Mesajları en eskiden en yeniye doğru sırala
      },
    });

    // İsteğe bağlı: Partner kullanıcının varlığını ve bilgilerini de çekebiliriz.
    // Bu, konuşma sayfasının başında partnerin adını vb. göstermek için kullanışlı olur.
    const partnerUser = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, username: true, profileImagePublicId: true }
    });

    if (!partnerUser) {
        return NextResponse.json({ message: "Konuşma partneri bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ messages, partnerUser }, { status: 200 });

  } catch (error) {
    console.error(`Kullanıcı ${currentUserId} ve ${partnerId} arasındaki mesajları getirme hatası:`, error);
    return NextResponse.json({ message: 'Mesajlar getirilirken bir hata oluştu.' }, { status: 500 });
  }
}