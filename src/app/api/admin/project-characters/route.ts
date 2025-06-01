// src/app/api/admin/project-characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Yeni karakter oluşturma şeması
const createCharacterSchema = z.object({
  name: z.string().min(1, 'Karakter adı gerekli.').max(100),
  projectId: z.number().int().positive('Geçerli bir proje IDsi gerekli.'),
  // description: z.string().optional(), // Opsiyonel alanlar eklenebilir
});

// POST: Yeni proje karakteri ekleme
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = createCharacterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Geçersiz veri.', errors: validation.error.issues }, { status: 400 });
    }

    const { name, projectId } = validation.data;

    // Projenin var olup olmadığını kontrol et
    const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectExists) {
      return NextResponse.json({ message: 'Karakter eklenecek proje bulunamadı.' }, { status: 404 });
    }

    const newCharacter = await prisma.projectCharacter.create({
      data: {
        name,
        projectId,
        // description: validation.data.description,
      },
    });
    return NextResponse.json(newCharacter, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('projectId') && error.meta?.target?.includes('name')) {
      return NextResponse.json({ message: 'Bu projede bu isimde bir karakter zaten mevcut.' }, { status: 409 });
    }
    console.error('Karakter ekleme hatası:', error);
    return NextResponse.json({ message: 'Karakter eklenirken bir hata oluştu.' }, { status: 500 });
  }
}

// GET: Tüm karakterleri (veya proje bazlı) listeleme (opsiyonel, proje bazlı listeleme için ayrı bir route daha iyi olabilir)
// Şimdilik bunu boş bırakıyorum, çünkü proje bazlı listeleme daha mantıklı.
// Eğer tüm karakterleri bir yerde listelemek isterseniz buraya ekleyebilirsiniz.
// export async function GET(request: NextRequest) { ... }