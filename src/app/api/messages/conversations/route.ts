// src/app/api/messages/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const currentUserId = parseInt(session.user.id, 10);
  if (isNaN(currentUserId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  try {
    // 1. Kullanıcının gönderdiği veya aldığı tüm mesajları çek
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: 'desc', // En yeni mesajlar önemli
      },
      include: {
        sender: { select: { id: true, username: true, profileImagePublicId: true } },
        receiver: { select: { id: true, username: true, profileImagePublicId: true } },
      },
    });

    // 2. Bu mesajlardan benzersiz konuşma partnerlerini ve her bir partnerle olan son mesajı çıkar
    const conversationsMap = new Map<
      number, 
      { 
        partner: { id: number; username: string; profileImagePublicId: string | null }; 
        lastMessage: { content: string; createdAt: Date; isSender: boolean };
      }
    >();

    for (const message of messages) {
      const partner = message.senderId === currentUserId ? message.receiver : message.sender;
      
      // Eğer bu partnerle bir konuşma zaten map'te yoksa veya bu mesaj daha yeniyse ekle/güncelle
      if (!conversationsMap.has(partner.id)) {
        conversationsMap.set(partner.id, {
          partner: {
            id: partner.id,
            username: partner.username,
            profileImagePublicId: partner.profileImagePublicId,
          },
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            isSender: message.senderId === currentUserId, // Bu mesajı ben mi gönderdim?
          },
        });
      }
      // Not: `orderBy: { createdAt: 'desc' }` sayesinde ilk karşılaşılan mesaj zaten son mesaj olacak.
      // Eğer aynı kullanıcıyla birden fazla mesaj varsa, ilk bulunan (en yeni) map'e eklenecek
      // ve sonrakiler (daha eski olanlar) map.has(partner.id) true döneceği için atlanacak.
    }

    const conversations = Array.from(conversationsMap.values());

    // İsteğe bağlı: Son mesaja göre sırala
    // conversations.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());

    return NextResponse.json(conversations, { status: 200 });

  } catch (error) {
    console.error('Konuşmaları getirme hatası:', error);
    return NextResponse.json({ message: 'Konuşmalar getirilirken bir hata oluştu.' }, { status: 500 });
  }
}