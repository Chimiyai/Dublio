// src/app/api/admin/projects/[slug]/characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface RouteParams {
  params: { slug: string }; // Dinamik segmentin adı 'slug'
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    console.log("API - PROJECT_SLUG_CHARACTERS - Yetkisiz erişim denemesi.");
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const projectSlug = params.slug; // params.slug'ı al
  console.log("API - PROJECT_SLUG_CHARACTERS - Gelen projectSlug:", projectSlug);

  if (!projectSlug || typeof projectSlug !== 'string' || projectSlug.toLowerCase() === "undefined" || projectSlug.toLowerCase() === "null" || projectSlug.trim() === "") {
      console.error("API - PROJECT_SLUG_CHARACTERS - Hata: projectSlug string değil, eksik, 'undefined'/'null' string'i veya boş.");
      return NextResponse.json({ message: 'Geçersiz veya eksik Proje Slug parametresi.' }, { status: 400 });
  }
  
  console.log(`API - PROJECT_SLUG_CHARACTERS - projectSlug "${projectSlug}" için karakterler çekiliyor...`);
  try {
    // Slug'a göre projeyi bul, sonra o projenin ID'si ile karakterleri çek
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      select: { id: true } // Sadece proje ID'sini almamız yeterli
    });

    if (!project) {
      console.error(`API - PROJECT_SLUG_CHARACTERS - Hata: Slug "${projectSlug}" ile eşleşen proje bulunamadı.`);
      return NextResponse.json({ message: `"${projectSlug}" slug'ına sahip proje bulunamadı.` }, { status: 404 });
    }

    const projectId = project.id; // Bulunan projenin ID'si
    console.log(`API - PROJECT_SLUG_CHARACTERS - Bulunan projectId: ${projectId} (slug: "${projectSlug}" için)`);

    const characters = await prisma.projectCharacter.findMany({
      where: { projectId: projectId }, // Artık doğru projectId'yi kullanıyoruz
      orderBy: { name: 'asc' },
    });
    console.log(`API - PROJECT_SLUG_CHARACTERS - Proje ID ${projectId} için bulunan karakterler:`, characters.length);
    return NextResponse.json(characters);

  } catch (error) {
    console.error(`API - PROJECT_SLUG_CHARACTERS - projectSlug "${projectSlug}" karakterlerini getirme hatası:`, error);
    return NextResponse.json({ message: 'Karakterler getirilirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}