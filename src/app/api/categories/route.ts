// src/app/api/categories/route.ts (Yeni Dosya)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true }, // Slug da faydalı olabilir
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Kategoriler getirilirken bir hata oluştu." }, { status: 500 });
  }
}