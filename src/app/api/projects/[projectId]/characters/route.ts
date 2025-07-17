// src/app/api/projects/[projectId]/characters/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

// Zod şeması doğru, sadece URL'yi nullable yapalım
const createCharacterSchema = z.object({
  name: z.string().min(1, "Karakter adı boş olamaz.").max(100),
  profileImage: z.string().url("Geçerli bir resim URL'si olmalı.").nullable().optional(),
});

// --- YENİ BİR KARAKTER OLUŞTURMA (POST) ---
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

    // --- İYİLEŞTİRİLMİŞ YETKİ KONTROLÜ ---
    // Kullanıcının bu projede yetkili bir role (Lider, Admin, Modder) sahip olup olmadığını kontrol et.
    const membership = await prisma.teamMember.findFirst({
        where: {
            userId: parseInt(session.user.id),
            team: {
                projects: {
                    some: { id: projectId }
                }
            },
            role: { in: ['LEADER', 'ADMIN', 'MODDER'] }
        }
    });

    if (!membership) {
        return new NextResponse('Karakter oluşturmak için yetkiniz yok.', { status: 403 });
    }
    // --- Yetki Kontrolü Sonu ---

    const body = await request.json();
    const validation = createCharacterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Geçersiz veri.", errors: validation.error.flatten() }, { status: 400 });
    }
    const { name, profileImage } = validation.data;

    // Karakter adının projede benzersiz olduğunu kontrol et (bu zaten doğru)
    const existingCharacter = await prisma.character.findUnique({
      where: { projectId_name: { projectId, name } }
    });
    if (existingCharacter) {
      return NextResponse.json({ message: "Bu isimde bir karakter zaten mevcut." }, { status: 409 });
    }

    const newCharacter = await prisma.character.create({
      data: {
        name,
        profileImage: profileImage || null, // Boş string ise null yap
        projectId,
      },
      // İYİLEŞTİRME: İstemcinin beklediği tam tipi döndürmek için.
      // Yeni karakterin henüz seslendirmeni olmayacağı için bu `include` gerekli.
      // Client'a boş bir `voiceActors` dizisi gitmesini sağlar.
      include: { 
        voiceActors: true
      }
    });

    return NextResponse.json(newCharacter, { status: 201 });

  } catch (error) {
    console.error("[CREATE_CHARACTER_ERROR]", error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}

// GET metodu genellikle bu tür API'lerde daha az kullanılır,
// çünkü veriler genellikle ana sayfa yüklenirken sunucu bileşeninde çekilir.
// Ancak ihtiyaç halinde burada kalabilir. Yetki kontrolü eklenmelidir.