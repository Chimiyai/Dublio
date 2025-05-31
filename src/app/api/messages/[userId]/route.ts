// src/app/api/messages/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

interface RouteParams {
  params: { userId: string }; // Sohbet edilen diğer kullanıcının ID'si
}

const getMessagesQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number), // Sayfa başına mesaj sayısı
});

// GET: Belirli bir kullanıcıyla olan mesajları listele
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const currentUserId = parseInt(session.user.id);
  const otherUserId = parseInt(params.userId);

  if (isNaN(otherUserId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const queryParse = getMessagesQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryParse.success) {
    return NextResponse.json({ message: 'Geçersiz sorgu parametreleri.', errors: queryParse.error.issues }, { status: 400 });
  }
  const { page, limit } = queryParse.data;
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
      messages: messagesFromDb, // ===> BURADA .reverse() OLMAMALI
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Mesaj göndermek için giriş yapmalısınız.' }, { status: 401 });
  }

  const senderId = parseInt(session.user.id);
  const receiverId = parseInt(params.userId);

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