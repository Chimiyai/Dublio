// src/app/api/messages/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const currentUserId = parseInt(session.user.id);

  try {
    // Kullanıcının dahil olduğu tüm mesajları çek
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: 'desc', // Her sohbet için en son mesajı bulmak üzere
      },
      include: {
        sender: { select: { id: true, username: true, profileImagePublicId: true } },
        receiver: { select: { id: true, username: true, profileImagePublicId: true } },
      },
    });

    // Mesajları diğer kullanıcıya göre grupla ve her gruptan son mesajı al
    const conversationsMap = new Map<number, any>();

    messages.forEach(message => {
      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === currentUserId ? message.receiver : message.sender;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: { // Diğer kullanıcı bilgileri
            id: otherUser.id,
            username: otherUser.username,
            profileImagePublicId: otherUser.profileImagePublicId,
            // onlineStatus: 'Çevrim içi' // Bu bilgi için ayrı bir sistem gerekir
          },
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
          // unreadCount: 0, // Okunmamış mesaj sayısı için ek mantık gerekir
        });
      }
      // İsteğe bağlı: Okunmamış mesaj sayısını da hesaplayabiliriz
      // (e.g., if (!message.isRead && message.receiverId === currentUserId) conversationsMap.get(otherUserId).unreadCount++)
    });
    
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json(conversations);

  } catch (error) {
    console.error('Sohbet listesi getirme hatası:', error);
    return NextResponse.json({ message: 'Sohbetler getirilirken bir hata oluştu.' }, { status: 500 });
  }
}