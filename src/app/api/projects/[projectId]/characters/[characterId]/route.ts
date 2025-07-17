// src/app/api/projects/[projectId]/characters/[characterId]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Bu dosyada karakter GÜNCELLEME (PUT) ve SİLME (DELETE) işlemleri olacak.

// === KARAKTER SİLME (DELETE) ===
export async function DELETE(
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

    // Yetki Kontrolü: Kullanıcı bu projenin Lideri/Admini/Modder'ı mı?
    const membership = await prisma.teamMember.findFirst({
        where: {
            userId: parseInt(session.user.id),
            team: { projects: { some: { id: projectId } } },
            role: { in: ['LEADER', 'ADMIN', 'MODDER'] }
        }
    });

    if (!membership) {
        return new NextResponse('Karakter silmek için yetkiniz yok.', { status: 403 });
    }

    // Karakteri sil. Prisma'daki `onDelete: Cascade` sayesinde,
    // bu karaktere bağlı `ProjectCharacterVoiceActor` kayıtları da silinecektir.
    // `TranslationLine`'lardaki `characterId` ise `SetNull` sayesinde null olacaktır.
    await prisma.character.delete({
      where: { id: characterId },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content: Başarılı ama geri dönecek içerik yok.

  } catch (error) {
    console.error("[DELETE_CHARACTER_ERROR]", error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}

// Gelecekte karakterin adını/resmini düzenlemek için PUT metodu buraya eklenebilir.