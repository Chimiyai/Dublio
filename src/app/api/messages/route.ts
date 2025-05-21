// src/app/api/messages/route.ts (POST metodu - Tahmini)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const createMessageSchema = z.object({
  receiverId: z.number().int(),
  content: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }
  const currentUserId = parseInt(session.user.id); // Oturum açmış kullanıcının ID'si

  try {
    const body = await request.json();
    const parsedBody = createMessageSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { receiverId, content } = parsedBody.data;

    if (receiverId === currentUserId) {
      return NextResponse.json({ message: 'Kendinize mesaj gönderemezsiniz.' }, { status: 400 });
    }

    // --- GÜVENLİK KONTROLÜ EKLEME YERİ ---
    // 1. Alıcı Kullanıcı Var mı?
    const receiverExists = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiverExists) {
      return NextResponse.json({ message: 'Alıcı kullanıcı bulunamadı.' }, { status: 404 });
    }

    // 2. (Opsiyonel ama Önerilir) Daha İleri Düzey Kontroller:
    //    - Kullanıcılar arasında bir "arkadaşlık" ilişkisi var mı?
    //    - Daha önce birbirleriyle mesajlaşmışlar mı?
    //    - Alıcı, göndericiden mesaj almayı engellemiş mi?
    //    Bu kontroller için Prisma şemanda ek tablolar/ilişkiler gerekebilir.
    //    Şimdilik en azından alıcının varlığını kontrol etmek iyi bir başlangıç.

    //    Basit bir örnek: Belki de kullanıcıların sadece belirli rollerdeki
    //    kişilere mesaj göndermesini istersin veya herkes herkese gönderebilir.
    //    Bu, platformunun mantığına bağlı.

    //    Eğer "herkes herkese mesaj gönderebilir" ise, alıcının varlık kontrolü yeterli.
    //    Eğer kısıtlamak istiyorsan, burada o mantığı eklemelisin.
    //    Örnek: Sadece adminlere mesaj atılabilsin (çok kısıtlı bir senaryo ama fikir vermesi için)
    //    if (receiverExists.role !== 'admin') {
    //        return NextResponse.json({ message: 'Bu kullanıcıya mesaj gönderemezsiniz.' }, { status: 403 });
    //    }


    const newMessage = await prisma.message.create({
      data: {
        senderId: currentUserId,
        receiverId: receiverId,
        content: content,
      },
      // ... (include veya select ile dönen veriyi ayarla)
    });

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    console.error("Mesaj gönderme hatası:", error);
    return NextResponse.json({ message: 'Mesaj gönderilirken bir hata oluştu.' }, { status: 500 });
  }
}