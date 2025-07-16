//src/app/api/projects/[projectId]/characters/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const createCharacterSchema = z.object({
  name: z.string().min(1, "Karakter adı boş olamaz.").max(100),
  description: z.string().max(500).optional(),
  profileImage: z.string().url("Geçerli bir resim URL'si olmalı.").optional(),
});

// --- PROJEYE AİT KARAKTERLERİ LİSTELEME ---
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = parseInt(params.projectId, 10);
    // TODO: Yetki kontrolü (sadece proje üyeleri görebilmeli)

    const characters = await prisma.character.findMany({
      where: { projectId: projectId },
      orderBy: { name: 'asc' },
      include: {
        voiceActors: { // Hangi seslendirmenlerin atandığını da getirelim
          include: { voiceActor: { select: { username: true, profileImage: true } } }
        }
      }
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error("[GET_CHARACTERS_ERROR]", error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}

// --- YENİ BİR KARAKTER OLUŞTURMA ---
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const projectId = parseInt(params.projectId, 10);
    if (!session?.user?.id || isNaN(projectId)) {
      return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
    }
    // TODO: Yetki kontrolü (sadece Lider/Admin/Modder karakter oluşturabilmeli)

    const body = await request.json();
    const validation = createCharacterSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse('Geçersiz veri', { status: 400 });
    }
    const { name, description, profileImage } = validation.data;

    // Karakter adının projede benzersiz olduğunu kontrol et
    const existingCharacter = await prisma.character.findUnique({
      where: { projectId_name: { projectId, name } }
    });
    if (existingCharacter) {
      return new NextResponse('Bu isimde bir karakter zaten mevcut.', { status: 409 });
    }

    const newCharacter = await prisma.character.create({
      data: {
        name,
        description,
        profileImage,
        projectId,
      },
      include: { // Yeni oluşturulan karakteri, seslendirmenleriyle birlikte geri döndür
        voiceActors: {
          include: { voiceActor: { select: { username: true, profileImage: true } } }
        }
      }
    });

    return NextResponse.json(newCharacter, { status: 201 });

  } catch (error) {
    console.error("[CREATE_CHARACTER_ERROR]", error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}