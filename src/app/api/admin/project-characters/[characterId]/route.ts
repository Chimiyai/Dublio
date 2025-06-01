// src/app/api/admin/project-characters/[characterId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

interface Params {
  params: { characterId: string };
}

// Karakter güncelleme şeması
const updateCharacterSchema = z.object({
  name: z.string().min(1, 'Karakter adı gerekli.').max(100).optional(),
  // description: z.string().optional(),
  // projectId: z.number().int().positive().optional(), // Proje ID'sinin değişmesine izin verilmeyebilir.
});

// GET: Tek bir karakterin detayları
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> } // DOĞRU: params bir Promise
) {
  const resolvedParams = await params; // params'ı await ile çöz
  const characterIdString = resolvedParams.characterId;
  if (!characterIdString) {
    return NextResponse.json({ message: 'Eksik karakter ID parametresi.' }, { status: 400 });
  }
  const characterId = parseInt(characterIdString, 10);

  if (isNaN(characterId)) {
    return NextResponse.json({ message: 'Geçersiz Karakter ID.' }, { status: 400 });
  }

  try {
    const character = await prisma.projectCharacter.findUnique({
      where: { id: characterId },
    });
    if (!character) {
      return NextResponse.json({ message: 'Karakter bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(character);
  } catch (error) {
    console.error(`Karakter ${characterId} getirme hatası:`, error);
    return NextResponse.json({ message: 'Karakter getirilirken bir hata oluştu.' }, { status: 500 });
  }
}

// PUT: Karakter güncelleme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> } // DOĞRU
) {
  const { characterId: characterIdString } = await params; // Doğrudan await ile destructure et
  if (!characterIdString) {
    return NextResponse.json({ message: 'Geçersiz Karakter ID.' }, { status: 400 });
  }
  const characterId = parseInt(characterIdString, 10);
  if (isNaN(characterId)) {
    return NextResponse.json({ message: 'Geçersiz Karakter ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = updateCharacterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Geçersiz veri.', errors: validation.error.issues }, { status: 400 });
    }

    const characterToUpdate = await prisma.projectCharacter.findUnique({ where: { id: characterId }});
    if (!characterToUpdate) {
         return NextResponse.json({ message: 'Güncellenecek karakter bulunamadı.' }, { status: 404 });
    }

    const updatedCharacter = await prisma.projectCharacter.update({
      where: { id: characterId },
      data: validation.data,
    });
    return NextResponse.json(updatedCharacter);
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('projectId') && error.meta?.target?.includes('name')) {
      return NextResponse.json({ message: 'Bu projede bu isimde bir karakter zaten mevcut.' }, { status: 409 });
    }
    console.error(`Karakter ${characterId} güncelleme hatası:`, error);
    return NextResponse.json({ message: 'Karakter güncellenirken bir hata oluştu.' }, { status: 500 });
  }
}

// DELETE: Karakter silme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> } // DOĞRU
) {
  const { characterId: characterIdString } = await params; // Doğrudan await ile destructure et
  if (!characterIdString) {
    return NextResponse.json({ message: 'Geçersiz Karakter ID.' }, { status: 400 });
  }

  const characterId = parseInt(characterIdString, 10);
  if (isNaN(characterId)) {
    return NextResponse.json({ message: 'Geçersiz Karakter ID.' }, { status: 400 });
  }

  try {
    // Karakteri silmeden önce ilişkili VoiceAssignment'ların silinmesi gerekebilir
    // Prisma'da onDelete: Cascade olduğu için ProjectCharacter silinince VoiceAssignment'lar da silinir.
    await prisma.projectCharacter.delete({
      where: { id: characterId },
    });
    return NextResponse.json({ message: 'Karakter başarıyla silindi.' }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') { // Kayıt bulunamadı
        return NextResponse.json({ message: 'Silinecek karakter bulunamadı.' }, { status: 404 });
    }
    // P2003: Foreign key constraint failed (Eğer VoiceAssignment'da onDelete: Cascade olmasaydı bu hatayı alabilirdik)
    console.error(`Karakter ${characterId} silme hatası:`, error);
    return NextResponse.json({ message: 'Karakter silinirken bir hata oluştu.' }, { status: 500 });
  }
}