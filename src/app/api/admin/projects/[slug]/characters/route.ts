// src/app/api/admin/projects/[slug]/characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

interface RouteParams {
  params: { slug: string }; // Dinamik segmentin adı 'slug'
}

export async function GET(
  request: NextRequest,
  context: any // GEÇİCİ: context'i any yap
  // VEYA: context: { params: { slug: string } } // Doğrudan tip belirt
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  // Güvenlik için params ve slug'ın varlığını kontrol et
  const projectSlug = context.params?.slug as string | undefined;
  if (!projectSlug || typeof projectSlug !== 'string' || projectSlug.trim() === "") {
      console.error("API project characters GET - Hata: projectSlug string değil, eksik veya boş.");
      return NextResponse.json({ message: 'Geçersiz veya eksik Proje Slug parametresi.' }, { status: 400 });
  }
  
  console.log(`API project characters GET - projectSlug "${projectSlug}" için karakterler çekiliyor...`);
  try {
    // Slug'a göre projeyi bul, sonra o projenin ID'si ile karakterleri çek
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      select: { id: true }
    });

    if (!project) {
      console.error(`API project characters GET - Hata: Slug "${projectSlug}" ile eşleşen proje bulunamadı.`);
      return NextResponse.json({ message: `"${projectSlug}" slug'ına sahip proje bulunamadı.` }, { status: 404 });
    }

    const projectId = project.id;
    const characters = await prisma.projectCharacter.findMany({
      where: { projectId: projectId },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(characters);

  } catch (error) {
    console.error(`API project characters GET - projectSlug "${projectSlug}" karakterlerini getirme hatası:`, error);
    return NextResponse.json({ message: 'Karakterler getirilirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
