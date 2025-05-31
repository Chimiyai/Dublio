// src/app/api/profile/update-details/route.ts (Yeni dosya olabilir)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const updateDetailsSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  bio: z.string().max(500).nullable().optional(),
  profileImagePublicId: z.string().nullable().optional(),
  bannerImagePublicId: z.string().nullable().optional(),
  // E-posta ve şifre için ayrı endpoint'ler daha güvenli
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }
  const userId = parseInt(session.user.id);

  try {
    const body = await request.json();
    const validation = updateDetailsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Geçersiz veri.', errors: validation.error.issues }, { status: 400 });
    }

    const dataToUpdate = validation.data;

    // Kullanıcı adı unique kontrolü (eğer güncelleniyorsa)
    if (dataToUpdate.username) {
      const existingUser = await prisma.user.findUnique({ where: { username: dataToUpdate.username } });
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ message: 'Bu kullanıcı adı zaten kullanımda.' }, { status: 409 });
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { // Sadece güvenli alanları döndür
        id: true, username: true, email: true, bio: true, 
        profileImagePublicId: true, bannerImagePublicId: true, role: true
      }
    });
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Profil güncelleme hatası:", error);
    return NextResponse.json({ message: error.message || 'Profil güncellenirken bir hata oluştu.' }, { status: 500 });
  }
}