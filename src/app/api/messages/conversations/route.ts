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
    // --- YENİ ENGELLEME KONTROLÜ ---
    // Bu kullanıcının engellediği veya bu kullanıcıyı engellemiş olan tüm ID'leri al
    const blockedUserRecords = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: currentUserId },
          { blockingId: currentUserId },
        ],
      },
    });
    const blockedUserIds = blockedUserRecords.map(block => 
      block.blockerId === currentUserId ? block.blockingId : block.blockerId
    );
    // -----------------------------

    // Mesajlaşma ortaklarını bulurken, engellenenleri hariç tut
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
        // --- YENİ FİLTRE ---
        // Gönderen veya alıcı, engellenenler listesinde OLMAMALI
        NOT: {
            senderId: { in: blockedUserIds },
            receiverId: { in: blockedUserIds },
        }
      },
      select: { senderId: true, receiverId: true },
    });

    const partnerIds = [...new Set(
      messages.map(m => m.senderId === currentUserId ? m.receiverId : m.senderId)
    )];

    // 2. Her bir sohbet ortağı için son mesajı ve okunmamış mesaj sayısını getir.
    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        // Son mesajı bul
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: partnerId },
              { senderId: partnerId, receiverId: currentUserId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: { id: true, username: true, profileImagePublicId: true } },
            receiver: { select: { id: true, username: true, profileImagePublicId: true } },
          },
        });

        if (!lastMessage) return null; // Eğer mesaj bulunamazsa (teorik olarak olmamalı)

        // Okunmamış mesaj sayısını say
        const unreadCount = await prisma.message.count({
          where: {
            senderId: partnerId, // Gönderen diğer kişi
            receiverId: currentUserId, // Alıcı ben
            isRead: false,
          },
        });

        // Diğer kullanıcının bilgilerini belirle
        const otherUser = lastMessage.senderId === currentUserId 
          ? lastMessage.receiver 
          : lastMessage.sender;

        return {
          user: {
            id: otherUser.id,
            username: otherUser.username,
            profileImagePublicId: otherUser.profileImagePublicId,
          },
          lastMessageContent: lastMessage.content,
          lastMessageAt: lastMessage.createdAt,
          isLastMessageReadByMe: lastMessage.receiverId === currentUserId ? lastMessage.isRead : true, // Son mesajı ben gönderdiysem okunmuş sayılır
          isLastMessageSentByMe: lastMessage.senderId === currentUserId,
          unreadCount, // Okunmamış mesaj sayısı
        };
      })
    );
    
    // Null olanları filtrele ve son mesaja göre sırala
    const validConversations = conversations
      .filter(c => c !== null)
      .sort((a, b) => new Date(b!.lastMessageAt).getTime() - new Date(a!.lastMessageAt).getTime());

    return NextResponse.json(validConversations);

  } catch (error) {
    console.error('Sohbet listesi getirme hatası:', error);
    return NextResponse.json({ message: 'Sohbetler getirilirken bir hata oluştu.' }, { status: 500 });
  }
}