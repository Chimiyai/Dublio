// src/app/api/admin/users/[userId]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server'; // NextRequest import edildi
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: "Rol 'user' veya 'admin' olmalıdır." }),
  }),
});

export async function PATCH(
  request: NextRequest, // Request tipini NextRequest olarak değiştirdik
  { params }: { params: Promise<{ userId: string }> } // params'ı Promise olarak al
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params; // params'ı çöz
  const userIdString = resolvedParams.userId;

  if (!userIdString || typeof userIdString !== 'string' || userIdString.trim() === "") {
    return NextResponse.json({ message: 'Eksik veya geçersiz kullanıcı ID parametresi.' }, { status: 400 });
  }
  const userIdToUpdateAsInt = parseInt(userIdString, 10);

  if (isNaN(userIdToUpdateAsInt)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID formatı.' }, { status: 400 });
  }

  if (session.user.id === userIdString) { // Karşılaştırmayı string üzerinden yapabiliriz veya ikisini de parse edebiliriz
    return NextResponse.json(
      { message: 'Admin kendi rolünü değiştiremez.' },
      { status: 400 }
    );
  }

  let newRole: 'user' | 'admin';
  try {
    const body = await request.json();
    const parsedBody = updateUserRoleSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }
    newRole = parsedBody.data.role;
  } catch (error) {
    return NextResponse.json({ message: 'İstek body hatalı veya JSON formatında değil.' }, { status: 400 });
  }

  try {
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userIdToUpdateAsInt },
    });

    if (!userToUpdate) {
      return NextResponse.json({ message: 'Rolü güncellenecek kullanıcı bulunamadı.' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdateAsInt },
      data: { role: newRole },
    });

    return NextResponse.json(
      { message: `'${updatedUser.username}' adlı kullanıcının rolü başarıyla '${newRole}' olarak güncellendi.` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Kullanıcı rolü güncelleme hatası:', error);
    return NextResponse.json(
      { message: 'Kullanıcı rolü güncellenirken sunucuda bir hata oluştu.', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest, // Request tipini NextRequest olarak değiştirdik
  { params }: { params: Promise<{ userId: string }> } // params'ı Promise olarak al
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params; // params'ı çöz
  const userIdString = resolvedParams.userId;

  if (!userIdString || typeof userIdString !== 'string' || userIdString.trim() === "") {
    return NextResponse.json({ message: 'Eksik veya geçersiz kullanıcı ID parametresi.' }, { status: 400 });
  }
  const userIdToDeleteAsInt = parseInt(userIdString, 10);

  if (isNaN(userIdToDeleteAsInt)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID formatı.' }, { status: 400 });
  }
  
  if (session.user.id === userIdString) { 
    return NextResponse.json(
      { message: 'Admin kendi hesabını silemez.' },
      { status: 400 }
    );
  }

  try {
    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDeleteAsInt },
    });

    if (!userToDelete) {
      return NextResponse.json({ message: 'Silinecek kullanıcı bulunamadı.' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userIdToDeleteAsInt }, 
    });

    return NextResponse.json({ message: `'${userToDelete.username}' adlı kullanıcı başarıyla silindi.` }, { status: 200 });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return NextResponse.json(
      { message: 'Kullanıcı silinirken sunucuda bir hata oluştu.', error: (error as Error).message },
      { status: 500 }
    );
  }
}