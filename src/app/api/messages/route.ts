// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Yeni mesaj gönderme şeması
const createMessageSchema = z.object({
  receiverId: z.number().int({ message: "Alıcı ID'si bir sayı olmalıdır." }),
  content: z.string().min(1, { message: "Mesaj içeriği boş olamaz." }).max(1000, { message: "Mesaj en fazla 1000 karakter olabilir." }),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim. Mesaj göndermek için giriş yapmalısınız.' }, { status: 401 });
  }

  const senderId = parseInt(session.user.id, 10);
  if (isNaN(senderId)) {
    return NextResponse.json({ message: 'Geçersiz gönderen ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedBody = createMessageSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { receiverId, content } = parsedBody.data;

    // 1. Alıcı kullanıcı var mı kontrol et
    const receiverExists = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true } // Sadece varlığını kontrol et
    });

    if (!receiverExists) {
      return NextResponse.json({ message: 'Alıcı kullanıcı bulunamadı.' }, { status: 404 });
    }

    // 2. Kendine mesaj göndermeyi engelle (isteğe bağlı)
    if (senderId === receiverId) {
        return NextResponse.json({ message: 'Kendinize mesaj gönderemezsiniz.' }, { status: 400 });
    }

    // 3. Mesajı veritabanına kaydet
    const newMessage = await prisma.message.create({
      data: {
        senderId: senderId,
        receiverId: receiverId,
        content: content,
      },
      include: { // Gönderilen mesajı hemen döndürmek için (opsiyonel)
        sender: { select: { id: true, username: true, profileImagePublicId: true }},
        receiver: { select: { id: true, username: true, profileImagePublicId: true }}
      }
    });

    // Başarılı yanıt
    return NextResponse.json(newMessage, { status: 201 }); // 201 Created

  } catch (error: any) {
    console.error('Mesaj gönderme API hatası:', error);
    if (error.code === 'P2003') { // Foreign key constraint (örn: olmayan receiverId)
        return NextResponse.json({ message: 'Alıcı bulunamadı veya geçersiz.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Mesaj gönderilirken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}

// Bu dosyaya GET isteği gelirse ne olacağını da tanımlayabiliriz (örn: tüm mesajları listeleme - dikkatli olmalı)
// Şimdilik sadece POST ekliyoruz.