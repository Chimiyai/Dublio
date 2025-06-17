// src/app/api/messages/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const getMessagesQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const resolvedParams = await params;
  const otherUserIdString = resolvedParams.userId;

  if (!otherUserIdString) {
    return NextResponse.json({ message: 'Eksik kullanıcı ID parametresi.' }, { status: 400 });
  }
  const currentUserId = parseInt(session.user.id);
  const otherUserId = parseInt(otherUserIdString);

  if (isNaN(otherUserId)) {
    return NextResponse.json({ message: 'Geçersiz sorgu parametreleri.' }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const queryParseResult = getMessagesQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryParseResult.success) { // queryParseResult kullan
    return NextResponse.json({ message: 'Geçersiz sorgu parametreleri.', errors: queryParseResult.error.issues }, { status: 400 }); // queryParseResult kullan
  }
  const { page, limit } = queryParseResult.data; // queryParseResult kullan
  const skip = (page - 1) * limit;

  try {
    const messagesFromDb = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, profileImagePublicId: true } },
        // receiver bilgisi de eklenebilir ama genellikle gerekmeyebilir mesaj listesinde
      },
      orderBy: { createdAt: 'asc' }, // En eski mesajdan en yeniye doğru
      skip,
      take: limit,
    });

    const totalMessages = await prisma.message.count({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
    });

    const firstUnreadMessage = await prisma.message.findFirst({
        where: {
            senderId: otherUserId,
            receiverId: currentUserId,
            isRead: false,
        },
        orderBy: {
            createdAt: 'asc' // En eski okunmamış mesaj
        }
    });
    
    // Okunmamış mesajları okundu olarak işaretleme (opsiyonel)
    // await prisma.message.updateMany({
    //   where: {
    //     senderId: otherUserId,
    //     receiverId: currentUserId,
    //     isRead: false,
    //   },
    //   data: { isRead: true, readAt: new Date() },
    // });

    return NextResponse.json({
      messages: messagesFromDb,
      firstUnreadMessageId: firstUnreadMessage?.id || null,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page,
      totalMessages,
    });

  } catch (error) {
    console.error('Mesajları getirme hatası:', error);
    return NextResponse.json({ message: 'Mesajlar getirilirken bir hata oluştu.' }, { status: 500 });
  }
}


// POST: Belirli bir kullanıcıya yeni mesaj gönderme
const createMessageSchema = z.object({
  content: z.string().min(1, "Mesaj boş olamaz.").max(2000, "Mesaj en fazla 2000 karakter olabilir."),
});

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> } // DOĞRUDAN TİP
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Mesaj göndermek için giriş yapmalısınız.' }, { status: 401 });
  }

  const resolvedParams = await params; // params'ı çöz
  const receiverIdString = resolvedParams.userId;

  if (!receiverIdString) { // Ekstra kontrol
    return NextResponse.json({ message: 'Eksik alıcı ID parametresi.' }, { status: 400 });
  }
  const senderId = parseInt(session.user.id);
  const receiverId = parseInt(receiverIdString); // Çözülmüş string'i parse et

  if (isNaN(receiverId)) {
    return NextResponse.json({ message: 'Geçersiz alıcı ID.' }, { status: 400 });
  }
  if (senderId === receiverId) {
    return NextResponse.json({ message: 'Kendinize mesaj gönderemezsiniz.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = createMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Geçersiz mesaj verisi.', errors: validation.error.issues }, { status: 400 });
    }
    const { content } = validation.data;

    // Alıcının var olup olmadığını kontrol et (opsiyonel ama iyi bir pratik)
    const receiverExists = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiverExists) {
      return NextResponse.json({ message: 'Mesaj gönderilecek kullanıcı bulunamadı.' }, { status: 404 });
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
      },
      include: { // Gönderilen mesajı, gönderen bilgisiyle döndür
        sender: {
          select: { id: true, username: true, profileImagePublicId: true },
        },
      },
    });

    // Burada bir event yayınlanabilir (Pusher, Socket.io vb. için)
    // veya alıcıya bir bildirim gönderilebilir. Şimdilik bu kısmı atlıyoruz.

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    return NextResponse.json({ message: 'Mesaj gönderilirken bir hata oluştu.' }, { status: 500 });
  }
}