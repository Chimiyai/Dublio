// src/app/api/admin/users/[userId]/ban/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const banSchema = z.object({
  reason: z.string().min(5, "Sebep en az 5 karakter olmalı.").max(255), // Max karakter eklemek iyi bir pratik
  // durationInDays `null` olduğunda kalıcı ban anlamına gelecek
  durationInDays: z.number().int().min(0).nullable().optional(), 
});

// RouteContext tipini burada tanımlayalım (veya merkezi bir dosyadan import edelim)
interface RouteContext { 
  params: Promise<{ 
    userId: string;
  }> 
}

// --- BANLAMA İŞLEMİ ---
export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params; // `await` ile Promise'i çöz
  const targetUserId = parseInt(resolvedParams.userId, 10);
  const adminId = parseInt(session.user.id);

  if (isNaN(targetUserId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  if (adminId === targetUserId) {
    return NextResponse.json({ message: 'Adminler kendilerini banlayamaz.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedBody = banSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { reason, durationInDays } = parsedBody.data;
    
    // `durationInDays` null ise veya 0'dan küçükse (kalıcı ban), `banExpiresAt` null olur.
    let banExpiresAt: Date | null = null;
    if (durationInDays && durationInDays > 0) {
      banExpiresAt = new Date();
      banExpiresAt.setDate(banExpiresAt.getDate() + durationInDays);
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isBanned: true,
        banReason: reason,
        banExpiresAt: banExpiresAt,
      },
    });

    return NextResponse.json({ message: 'Kullanıcı başarıyla banlandı.' });

  } catch (error) {
    console.error("Kullanıcı banlama hatası:", error);
    return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
  }
}

// --- BAN KALDIRMA İŞLEMİ ---
export async function DELETE(request: NextRequest, { params }: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const resolvedParams = await params; // `await` ile Promise'i çöz
    const targetUserId = parseInt(resolvedParams.userId, 10);

    if (isNaN(targetUserId)) {
        return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
    }

    try {
        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                isBanned: false,
                banReason: null,
                banExpiresAt: null,
            },
        });
        return NextResponse.json({ message: 'Kullanıcının banı kaldırıldı.' });
    } catch (error) {
        console.error("Ban kaldırma hatası:", error);
        return NextResponse.json({ message: 'Bir hata oluştu.' }, { status: 500 });
    }
}