// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/dublaj/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { TranslationStatus, Prisma } from '@prisma/client';
import DubbingStudioClient from '@/components/projects/DubbingStudioClient';
import { TranslationLineForModder } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page';

export type LineForDubbingWithDetails = TranslationLineForModder;

async function getLinesForDubbing(projectId: number, userId: number): Promise<LineForDubbingWithDetails[]> {
  const lines = await prisma.translationLine.findMany({
    where: {
      // DÜZELTME: Asset artık doğrudan projeye bağlı değil.
      // `translatableAsset` üzerinden gidiyoruz.
      sourceAsset: {
        translatableAsset: {
          projectId: projectId
        }
      },
      character: {
        voiceActors: {
          some: { voiceActorId: userId }
        }
      },
      OR: [
        { status: TranslationStatus.APPROVED },
        { isNonDialogue: true }
      ]
    },
    // DÜZELTME: Tip ile %100 eşleşmesi için `select` bloğunu güncelliyoruz.
    select: {
        id: true,
        sourceAssetId: true,
        key: true,
        originalText: true,
        translatedText: true,
        status: true,
        notes: true,
        voiceRecordingUrl: true,
        characterId: true,
        originalVoiceReferenceAssetId: true,
        isNonDialogue: true,
        character: { select: { id: true, name: true, profileImage: true } },
        // DÜZELTME: isNonDialogue artık Asset'te yok.
        originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } },
        sourceAsset: { select: { id: true, name: true, path: true, type: true } },
    }
  });
  
  // TypeScript'in emin olması için `as` kullanabiliriz, ama select doğruysa gerek kalmaz.
  return lines as LineForDubbingWithDetails[];
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
                <p style={{color: 'gray', fontStyle: 'italic'}}>
                    Size atanmış ve seslendirme için hazır (onaylanmış veya diyalog dışı) bir replik bulunmuyor.
                </p>
            )}
        </div>
    );
}