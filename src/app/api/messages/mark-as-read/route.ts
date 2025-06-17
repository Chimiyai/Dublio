// src/app/api/messages/mark-as-read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { senderId } = body; // Konuştuğumuz diğer kullanıcının ID'si

    if (!senderId || typeof senderId !== 'number') {
      return NextResponse.json({ message: 'Geçersiz gönderen ID\'si.' }, { status: 400 });
    }

    const currentUserId = parseInt(session.user.id);

    // Veritabanı güncellemesi:
    // Alıcısı ben (currentUserId) olan,
    // Göndereni diğer kullanıcı (senderId) olan,
    // ve henüz okunmamış (isRead: false) olan tüm mesajları bul ve güncelle.
    const updateResult = await prisma.message.updateMany({
      where: {
        receiverId: currentUserId,
        senderId: senderId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // `updateResult.count`, kaç adet mesajın güncellendiğini döner.
    console.log(`${updateResult.count} mesaj okundu olarak işaretlendi. (Kullanıcı: ${currentUserId}, Sohbet: ${senderId})`);

    // Client'a başarılı yanıtı dön
    return NextResponse.json({ message: 'Mesajlar okundu olarak işaretlendi.', count: updateResult.count });

  } catch (error) {
    console.error('Mesajları okundu olarak işaretleme hatası:', error);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}