// src/app/api/admin/categories/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import slugify from 'slugify';

// Kategori oluşturma için Zod şeması
const createCategorySchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır.").max(50),
});

// --- GET: Tüm Kategorileri Listele ---
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { projects: true } } } // Her kategoride kaç proje olduğunu say
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Kategori listeleme hatası:", error);
    return NextResponse.json({ message: "Kategoriler getirilirken bir hata oluştu." }, { status: 500 });
  }
}

// --- POST: Yeni Kategori Oluştur ---
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const parsedBody = createCategorySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name } = parsedBody.data;
    const slug = slugify(name, { lower: true, strict: true });

    // Aynı isimde veya slug'da kategori var mı kontrol et
    const existingCategory = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] }
    });
    if (existingCategory) {
      return NextResponse.json({ message: 'Bu isimde veya URL metninde bir kategori zaten mevcut.' }, { status: 409 });
    }

    const newCategory = await prisma.category.create({
      data: { name, slug }
    });

    return NextResponse.json(newCategory, { status: 201 });

  } catch (error) {
    console.error("Kategori oluşturma hatası:", error);
    return NextResponse.json({ message: "Kategori oluşturulurken bir hata oluştu." }, { status: 500 });
  }
}