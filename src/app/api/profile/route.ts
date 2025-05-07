import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Kullanıcı adı güncelleme için şema
const updateUsernameSchema = z.object({
  username: z.string()
    .min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." })
    .max(30, { message: "Kullanıcı adı en fazla 30 karakter olabilir." })
    // İsteğe bağlı: Kullanıcı adında sadece belirli karakterlere izin verme
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir." })
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // 1. Oturum Kontrolü: Kullanıcı giriş yapmış mı?
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim. Lütfen giriş yapın.' }, { status: 401 });
  }

  // Oturumdaki ID'yi al (string olabilir, DB için number lazım)
  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) {
     return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    // 2. Veri Doğrulama (Zod ile)
    const parsedBody = updateUsernameSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username: newUsername } = parsedBody.data;

    // 3. Benzersizlik Kontrolü: Yeni kullanıcı adı başkası tarafından kullanılıyor mu?
    const existingUser = await prisma.user.findUnique({
        where: { username: newUsername },
        select: { id: true } // Sadece ID'yi çekmek yeterli
    });

    // Eğer kullanıcı adı başkasına aitse hata ver
    if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
            { message: 'Bu kullanıcı adı zaten kullanımda.', errors: { username: ['Bu kullanıcı adı zaten alınmış.'] }}, 
            { status: 409 } // Conflict
        );
    }

    // 4. Kullanıcı Adını Güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId }, // Mevcut kullanıcının ID'si ile
      data: { username: newUsername },
      select: { // Sadece güncellenen kullanıcı adını ve ID'yi döndürelim (veya ne gerekiyorsa)
        id: true,
        username: true,
      }
    });

    // Başarılı yanıt
    // Not: NextAuth session'ını da güncellemek gerekebilir anında yansıması için,
    // ama şimdilik sadece DB'yi güncelliyoruz. Sayfa yenilendiğinde session güncellenir.
    return NextResponse.json({ 
        message: 'Kullanıcı adı başarıyla güncellendi.', 
        user: updatedUser 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Kullanıcı adı güncelleme hatası:', error);
     if (error.code === 'P2025') { // Kullanıcı bulunamadı hatası
        return NextResponse.json({ message: 'Güncellenecek kullanıcı bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Kullanıcı adı güncellenirken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}