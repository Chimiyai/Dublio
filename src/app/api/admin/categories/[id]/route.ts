// src/app/api/admin/categories/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import slugify from 'slugify';

// Kategori güncelleme şeması
const updateCategorySchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır.").max(50),
});

interface RouteContext { params: { id: string } }

// --- PUT: Mevcut Kategoriyi Güncelle ---
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }
  
  const categoryId = parseInt(params.id);
  if (isNaN(categoryId)) {
    return NextResponse.json({ message: 'Geçersiz ID formatı.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedBody = updateCategorySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name } = parsedBody.data;
    const slug = slugify(name, { lower: true, strict: true });

    // Güncellenen isim/slug başka bir kategori tarafından kullanılıyor mu?
    const existingCategory = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }], NOT: { id: categoryId } }
    });
    if (existingCategory) {
      return NextResponse.json({ message: 'Bu isimde veya URL metninde başka bir kategori zaten mevcut.' }, { status: 409 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name, slug }
    });

    return NextResponse.json(updatedCategory);

  } catch (error) {
    console.error(`Kategori (ID: ${categoryId}) güncelleme hatası:`, error);
    return NextResponse.json({ message: "Kategori güncellenirken bir hata oluştu." }, { status: 500 });
  }
}

// --- DELETE: Kategoriyi Sil ---
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const categoryId = parseInt(params.id);
  if (isNaN(categoryId)) {
    return NextResponse.json({ message: 'Geçersiz ID formatı.' }, { status: 400 });
  }

  try {
    // ÖNEMLİ: Bu kategoriyi kullanan projeler varsa ne olacak?
    // Prisma şemasında `onDelete` kuralı belirtilmediyse, ilişkili proje varken kategori silinemez ve hata verir.
    // Bu iyi bir şey, veri bütünlüğünü korur.
    await prisma.category.delete({
      where: { id: categoryId }
    });

    return new NextResponse(null, { status: 204 }); // Başarılı, içerik yok

  } catch (error: any) {
    console.error(`Kategori (ID: ${categoryId}) silme hatası:`, error);
    // P2003: Foreign key constraint failed on the field
    if (error.code === 'P2003') {
        return NextResponse.json({ message: 'Bu kategori projelere atandığı için silinemez. Önce projelerden kaldırın.'}, { status: 409 });
    }
    return NextResponse.json({ message: "Kategori silinirken bir hata oluştu." }, { status: 500 });
  }
}