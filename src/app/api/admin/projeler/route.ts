import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }
  // ... (POST içeriği aynı kalacak) ...
  try {
    const body = await request.json();
    const {
      title,
      slug,
      type,
      description,
      coverImage,
      releaseDate,
      isPublished,
    } = body;

    if (!title || !slug || !type || !releaseDate) {
      return NextResponse.json(
        { message: 'Başlık, slug, tür ve yayın tarihi zorunludur.' },
        { status: 400 }
      );
    }
    const existingProject = await prisma.project.findUnique({
      where: { slug },
    });
    if (existingProject) {
      return NextResponse.json(
        { message: 'Bu URL metni (slug) zaten kullanılıyor.' },
        { status: 409 }
      );
    }
    const newProject = await prisma.project.create({
      data: {
        title,
        slug,
        type,
        description,
        coverImage,
        releaseDate: new Date(releaseDate),
        isPublished,
      },
    });
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Proje oluşturma hatası:', error);
    if (error instanceof Error && error.message.includes('Invalid date')) {
        return NextResponse.json({ message: 'Geçersiz tarih formatı.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Proje oluşturulurken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
    }
    // ... (GET içeriği aynı kalacak) ...
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        console.error("Projeler getirilirken hata:", error);
        return NextResponse.json({ message: "Projeler getirilirken bir hata oluştu." }, { status: 500 });
    }
}
