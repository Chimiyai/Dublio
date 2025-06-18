// src/app/api/admin/users/[userId]/update-username/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

const usernameSchema = z.object({
  username: z.string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
    .max(20, "Kullanıcı adı en fazla 20 karakter olabilir.")
    .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir."),
});

// Fonksiyon imzasını ve parametre kullanımını güncelliyoruz
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> } // <<< İMZAYI GÜNCELLE
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const resolvedParams = await params; // `await` ile çöz
    const targetUserId = parseInt(resolvedParams.userId, 10);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
    }

    const body = await request.json();
    const validation = usernameSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { username } = validation.data;

    // Yeni kullanıcı adının başkası tarafından kullanılıp kullanılmadığını kontrol et
    const existingUser = await prisma.user.findFirst({
      where: { username, NOT: { id: targetUserId } }
    });
    if (existingUser) {
      return NextResponse.json({ message: 'Bu kullanıcı adı zaten alınmış.' }, { status: 409 });
    }

    // Veritabanını Güncelle
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { username },
    });

    return NextResponse.json({ message: 'Kullanıcı adı başarıyla güncellendi.', user: updatedUser });

  } catch (error) {
    console.error("Kullanıcı adı güncelleme hatası:", error);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}