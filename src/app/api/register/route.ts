// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Prisma Client'ı import ediyoruz
import bcrypt from 'bcrypt';

// bcrypt paketini kurduğumuzdan emin olalım: npm install bcrypt @types/bcrypt
// (Daha önceki adımlarda kurmuş olmalıyız ama kontrol etmekte fayda var)

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Kullanıcı adı, e-posta ve şifre gereklidir.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        // role: 'user' // Varsayılan olduğu için gerek yok
      },
    });

    console.log(`Yeni kullanıcı kaydedildi: ${newUser.email} (ID: ${newUser.id})`);
    return NextResponse.json({ message: 'Kayıt başarılı!', userId: newUser.id }, { status: 201 });

  } catch (error) {
    console.error('Kayıt API Hatası:', error);
    // Geliştirme aşamasında daha detaylı hata loglama
    if (error instanceof Error) {
         console.error(error.message);
    }
    return NextResponse.json({ message: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.' }, { status: 500 });
  }
}