import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

interface RouteContext {
  params: {
    slug: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }
  // ... (PUT içeriği aynı kalacak) ...
  const currentSlug = params.slug;
  try {
    const body = await request.json();
    const {
      title,
      type,
      description,
      coverImage,
      releaseDate,
      isPublished,
    } = body;

    if (!title || !type || !releaseDate) {
      return NextResponse.json(
        { message: 'Başlık, tür ve yayın tarihi zorunludur.' },
        { status: 400 }
      );
    }
    const updatedProject = await prisma.project.update({
      where: { slug: currentSlug },
      data: {
        title,
        type,
        description,
        coverImage,
        releaseDate: new Date(releaseDate),
        isPublished,
      },
    });
    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error(`Proje (slug: ${currentSlug}) güncelleme hatası:`, error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
         return NextResponse.json({ message: 'Güncellenecek proje bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Proje güncellenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
    }
    // ... (GET içeriği aynı kalacak) ...
    const slug = params.slug;
    try {
        const project = await prisma.project.findUnique({
            where: { slug: slug }
        });
        if (!project) {
            return NextResponse.json({ message: "Proje bulunamadı." }, { status: 404 });
        }
        return NextResponse.json(project, { status: 200 });
    } catch (error) {
        console.error(`Proje (slug: ${slug}) getirilirken hata:`, error);
        return NextResponse.json({ message: "Proje getirilirken bir hata oluştu." }, { status: 500 });
    }
}
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const slugToDelete = params.slug;

  try {
    // Projeyi slug ile bul ve sil
    // Silmeden önce projenin var olup olmadığını kontrol etmek iyi bir pratiktir,
    // ama prisma.project.delete zaten bulamazsa hata fırlatır (P2025).
    const deletedProject = await prisma.project.delete({
      where: { slug: slugToDelete },
    });

    // Başarılı silme durumunda boş bir yanıt veya bir mesaj döndürebiliriz
    // Genellikle DELETE isteklerine 204 No Content (içerik yok) veya 200 OK (bir mesajla) dönülür.
    return NextResponse.json({ message: `"${deletedProject.title}" başlıklı proje başarıyla silindi.` }, { status: 200 });
    // Veya: return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error(`Proje (slug: ${slugToDelete}) silme hatası:`, error);
    // Prisma'nın "kayıt bulunamadı" hatası
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Silinecek proje bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Proje silinirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
