//src/app/api/projects/[projectId]/characters/[characterId]/voice-actors/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const updateVoiceActorsSchema = z.object({
  voiceActorIds: z.array(z.number().int()).min(0, "Seslendirmen ID'leri listesi boş olamaz (boşsa hiç atanmamalı)."),
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
    const userId = parseInt(session.user.id);

    // 1. Yetki Kontrolü: Kullanıcı bu projenin Modder'ı, Lideri veya Admini mi?
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { team: { select: { members: { where: { userId: userId }, select: { role: true } } } } }
    });
    const isAuthorized = project?.team.members.some(m => ['LEADER', 'ADMIN', 'MODDER'].includes(m.role));
    if (!isAuthorized) {
        return new NextResponse('Bu işlemi yapma yetkiniz yok.', { status: 403 });
    }

    const body = await request.json();
    const validation = updateVoiceActorsSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse('Geçersiz veri', { status: 400 });
    }
    const { voiceActorIds } = validation.data;

    // 2. İşlemi Transaction ile yap: Öncekileri sil, yenileri ekle
    await prisma.$transaction(async (tx) => {
        // Mevcut atamaları sil
        await tx.projectCharacterVoiceActor.deleteMany({
            where: { characterId: characterId }
        });

        // Yeni atamaları oluştur
        if (voiceActorIds.length > 0) {
            await tx.projectCharacterVoiceActor.createMany({
                data: voiceActorIds.map(actorId => ({
                    characterId: characterId,
                    voiceActorId: actorId,
                }))
            });
        }
    });

    // 3. Güncellenmiş karakteri, yeni seslendirmenleriyle birlikte geri döndür
    const updatedCharacter = await prisma.character.findUnique({
        where: { id: characterId },
        include: {
            voiceActors: {
                include: { voiceActor: { select: { username: true, profileImage: true } } }
            }
        }
    });

    return NextResponse.json(updatedCharacter);

  } catch (error) {
    console.error("[UPDATE_VOICE_ACTORS_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}