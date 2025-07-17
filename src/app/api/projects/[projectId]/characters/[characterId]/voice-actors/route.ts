// src/app/api/projects/[projectId]/characters/[characterId]/voice-actors/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const updateVoiceActorsSchema = z.object({
  // min(0) gereksiz, boş diziye izin veriyoruz.
  voiceActorIds: z.array(z.number().int()),
});

export async function PUT(
  request: Request,
  { params }: { params: { projectId: string, characterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const projectId = parseInt(params.projectId, 10);
    const characterId = parseInt(params.characterId, 10);
    if (!session?.user?.id || isNaN(projectId) || isNaN(characterId)) {
      return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
    }

    // --- İYİLEŞTİRİLMİŞ YETKİ KONTROLÜ ---
    const membership = await prisma.teamMember.findFirst({
        where: {
            userId: parseInt(session.user.id),
            team: { projects: { some: { id: projectId } } },
            role: { in: ['LEADER', 'ADMIN', 'MODDER'] }
        }
    });
    if (!membership) {
        return new NextResponse('Bu işlemi yapma yetkiniz yok.', { status: 403 });
    }
    // --- Yetki Kontrolü Sonu ---

    const body = await request.json();
    const validation = updateVoiceActorsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Geçersiz veri", errors: validation.error.flatten() }, { status: 400 });
    }
    const { voiceActorIds } = validation.data;

    // İşlemi Transaction ile yapmak doğru bir yaklaşım.
    await prisma.$transaction(async (tx) => {
        // Mevcut tüm atamaları bu karakter için sil
        await tx.projectCharacterVoiceActor.deleteMany({
            where: { characterId: characterId }
        });

        // Eğer yeni bir atama listesi geldiyse, onları ekle
        if (voiceActorIds.length > 0) {
            await tx.projectCharacterVoiceActor.createMany({
                data: voiceActorIds.map(actorId => ({
                    characterId: characterId,
                    voiceActorId: actorId,
                }))
            });
        }
    });

    // Güncellenmiş karakteri, yeni seslendirmenleriyle birlikte geri döndür
    const updatedCharacter = await prisma.character.findUnique({
        where: { id: characterId },
        include: {
            // İYİLEŞTİRME: İstemcinin tam veriye ihtiyacı var.
            voiceActors: {
                include: { 
                  // Sadece ID değil, kullanıcı adını ve resmini de alalım
                  voiceActor: {
                    select: { id: true, username: true, profileImage: true }
                  } 
                }
            }
        }
    });

    return NextResponse.json(updatedCharacter);

  } catch (error) {
    console.error("[UPDATE_VOICE_ACTORS_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}