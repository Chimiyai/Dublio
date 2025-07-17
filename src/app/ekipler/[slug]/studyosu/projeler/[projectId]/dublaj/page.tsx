// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/dublaj/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { TranslationStatus, Prisma } from '@prisma/client';
import DubbingStudioClient from '@/components/projects/DubbingStudioClient';

// === YENİ TİP TANIMI ===
// Dublaj stüdyosunun ihtiyacı olan tam veri yapısını burada tanımlıyoruz.
export type LineForDubbing = Prisma.TranslationLineGetPayload<{
    include: {
        character: { select: { id: true, name: true, profileImage: true } },
        originalVoiceReferenceAsset: { select: { id: true, name: true, path: true } }
    }
}>;

// === YENİ VERİ ÇEKME FONKSİYONU ===
async function getLinesForDubbing(projectId: number, userId: number): Promise<LineForDubbing[]> {
  return prisma.translationLine.findMany({
    where: {
      // 1. Satır, bu projeye ait bir asset'ten gelmeli
      sourceAsset: {
        projectId: projectId
      },
      // 2. Satır, bu kullanıcıya (seslendirmen) atanmış bir karaktere ait olmalı
      character: {
        voiceActors: {
          some: { voiceActorId: userId }
        }
      },
      // 3. Ya "onaylanmış" olmalı YA DA "diyalog dışı" olmalı
      OR: [
        { status: TranslationStatus.APPROVED },
        { isNonDialogue: true }
      ]
    },
    include: {
        character: { select: { id: true, name: true, profileImage: true } },
        originalVoiceReferenceAsset: { select: { id: true, name: true, path: true } }
    },
    orderBy: { key: 'asc' }
  });
}

export default async function DubbingStudioPage({ params }: { params: { projectId: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound();
    const userId = parseInt(session.user.id);
    
    // Yetki kontrolü (bu zaten doğru)
    const isMember = await prisma.teamMember.findFirst({
        where: {
            user: { id: userId },
            team: { projects: { some: { id: projectId } } }
        }
    });

    if (!isMember) {
      return (
        <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>
            <h1>Erişim Reddedildi</h1>
            <p>Bu projenin dublaj atölyesini görmek için ekip üyesi olmalısınız.</p>
        </div>
      );
    }

    const linesForDubbing = await getLinesForDubbing(projectId, userId);

    return (
        <div>
            <h1>Dublaj Atölyesi</h1>
            <p>
                Aşağıda, seslendirmeniz için onaylanmış ve size atanmış replikler listelenmektedir.
            </p>
            <hr style={{margin: '20px 0'}} />

            {linesForDubbing.length > 0 ? (
                <DubbingStudioClient lines={linesForDubbing} />
            ) : (
                <p>Size atanmış ve seslendirme için hazır bir replik bulunmuyor.</p>
            )}
        </div>
    );
}
