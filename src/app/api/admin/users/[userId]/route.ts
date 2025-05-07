import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod'; // Veri doğrulama için Zod'u kullanacağız

// Rol güncelleme için beklenen request body'sinin şeması
const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: "Rol 'user' veya 'admin' olmalıdır." }),
  }),
});

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);

  // 1. Oturum ve admin rolü kontrolü
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const userIdToUpdateAsInt = parseInt(params.userId, 10);
  if (isNaN(userIdToUpdateAsInt)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID formatı.' }, { status: 400 });
  }

  // 2. Adminin kendi rolünü değiştirmesini engelleme
  // session.user.id (string) ve params.userId (string) karşılaştırması
  if (session.user.id === params.userId) {
    return NextResponse.json(
      { message: 'Admin kendi rolünü değiştiremez.' },
      { status: 400 } // Bad Request
    );
  }

  // 3. Request body'sinden yeni rolü al ve doğrula
  let newRole: 'user' | 'admin';
  try {
    const body = await request.json();
    const parsedBody = updateUserRoleSchema.safeParse(body);

    if (!parsedBody.success) {
      // Zod'un kendi hata mesajlarını kullanmak için
      return NextResponse.json({ message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }
    newRole = parsedBody.data.role;
  } catch (error) {
    return NextResponse.json({ message: 'İstek body hatalı veya JSON formatında değil.' }, { status: 400 });
  }

  try {
    // 4. Kullanıcıyı bul
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userIdToUpdateAsInt },
    });

    if (!userToUpdate) {
      return NextResponse.json({ message: 'Rolü güncellenecek kullanıcı bulunamadı.' }, { status: 404 });
    }

    // 5. Kullanıcıyı güncelle (sadece rolünü)
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdateAsInt },
      data: {
        role: newRole,
      },
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

// Mevcut DELETE fonksiyonunuz burada kalacak
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  // ... (önceki DELETE fonksiyonunun içeriği)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const userIdToDeleteAsInt = parseInt(params.userId, 10);

  if (isNaN(userIdToDeleteAsInt)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID formatı.' }, { status: 400 });
  }
  
  if (session.user.id === params.userId) { 
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
