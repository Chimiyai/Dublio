import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// Şifre güncelleme şeması
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Mevcut şifre boş olamaz." }),
  newPassword: z.string()
    .min(6, { message: "Yeni şifre en az 6 karakter olmalıdır." })
    .max(50, { message: "Yeni şifre en fazla 50 karakter olabilir." }),
  // confirmPassword frontend'de kontrol edilecek, API'ye göndermeye gerek yok
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) {
     return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // 1. Veri Doğrulama (Zod)
    const parsedBody = updatePasswordSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsedBody.data;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
    });

    // --- DÜZELTME BURADA ---
    if (!user || !user.password) {
        // Kullanıcı bulunamazsa veya bir şekilde veritabanında şifresi yoksa.
        return NextResponse.json(
            { message: 'Kullanıcı bulunamadı veya şifre bilgisi eksik.' }, 
            { status: 404 }
        );
    }

    // Artık user.password'ın null olmadığını biliyoruz.
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    // -----------------------

    if (!isCurrentPasswordValid) {
        return NextResponse.json(
            { message: 'Mevcut şifre yanlış.', errors: { currentPassword: ['Mevcut şifreniz hatalı.'] }}, 
            { status: 400 }
        );
    }

    // 4. Yeni şifreyi hash'le
    const hashedNewPassword = await bcrypt.hash(newPassword, 10); // 10 salt round

    // 5. Veritabanında şifreyi güncelle
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });

    // Başarılı yanıt
    return NextResponse.json({ message: 'Şifre başarıyla güncellendi.' }, { status: 200 });

  } catch (error: any) {
    console.error('Şifre güncelleme hatası:', error);
     if (error.code === 'P2025') { // Kullanıcı bulunamadı
        return NextResponse.json({ message: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Şifre güncellenirken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
