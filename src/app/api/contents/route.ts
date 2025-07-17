// src/app/api/contents/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { ContentType } from '@prisma/client';

// Gelen veriyi doğrulamak için bir Zod şeması
const contentSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır.'),
  slug: z.string().min(3, 'Slug en az 3 karakter olmalıdır.').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir.'),
  type: z.nativeEnum(ContentType),
  description: z.string().optional(),
  coverImageUrl: z.string().url('Geçerli bir URL girin.').optional().or(z.literal('')),
  bannerUrl: z.string().url('Geçerli bir URL girin.').optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return new NextResponse('Yetkisiz', { status: 403 });
    }

    const body = await request.json();
    const validation = contentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Geçersiz veri", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // Slug'ın benzersiz olduğundan emin ol
    const existingContent = await prisma.content.findUnique({
      where: { slug: validation.data.slug },
    });

    if (existingContent) {
      return NextResponse.json({ message: "Bu slug zaten kullanılıyor." }, { status: 409 });
    }

    const newContent = await prisma.content.create({
      data: {
        ...validation.data,
        // URL alanları boş string ise null'a çevir
        coverImageUrl: validation.data.coverImageUrl || null,
        bannerUrl: validation.data.bannerUrl || null,
      }
    });

    return NextResponse.json(newContent, { status: 201 });

  } catch (error) {
    console.error("[CONTENTS_POST_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}