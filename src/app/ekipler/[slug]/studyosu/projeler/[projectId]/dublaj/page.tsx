// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/dublaj/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { TranslationStatus, Prisma } from '@prisma/client';
import DubbingStudioClient from '@/components/projects/DubbingStudioClient';

// ==========================================================
// === BÖLÜM 1: DOĞRU TİP TANIMI ===
// ==========================================================
// "select" kullanarak verinin tam ve doğru şeklini tanımlıyoruz.
// Yorum sayısını döndüren yardımcı fonksiyon
async function getCommentCountForLine(lineId: number) {
    return prisma.comment.count({
        where: {
            targetType: 'TRANSLATION_LINE',
            targetId: lineId
        }
    });
}

export type LineForDubbingWithDetails = Prisma.TranslationLineGetPayload<{
    select: {
        id: true,
        key: true,
        translatedText: true,
        voiceRecordingUrl: true,
        isNonDialogue: true,
        status: true,
        character: { 
            select: { id: true, name: true, profileImage: true } 
        },
        originalVoiceReferenceAsset: { 
            select: { id: true, name: true, path: true } 
        }
    }
}> & { commentCount: number };

// ==========================================================
// === BÖLÜM 2: DOĞRU VERİ ÇEKME FONKSİYONU ===
// ==========================================================
async function getLinesForDubbing(projectId: number, userId: number): Promise<LineForDubbingWithDetails[]> {
  const lines = await prisma.translationLine.findMany({
    where: {
      sourceAsset: {
        projectId: projectId
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
    select: {
        id: true,
        key: true,
        translatedText: true,
        voiceRecordingUrl: true,
        isNonDialogue: true,
        status: true,
        character: { select: { id: true, name: true, profileImage: true } },
        originalVoiceReferenceAsset: { select: { id: true, name: true, path: true } }
    },
    orderBy: { key: 'asc' }
  });
  
  // Her satıra commentCount ekle
  const linesWithCommentCount = await Promise.all(
    lines.map(async line => ({
      ...line,
      commentCount: await getCommentCountForLine(line.id)
    }))
  );
  
  return linesWithCommentCount;
}

// ==========================================================
// === BÖLÜM 3: SAYFA COMPONENT'İ (DEĞİŞİKLİK YOK) ===
// ==========================================================

export default async function DubbingStudioPage({ params }: { params: { projectId: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound();
    const userId = parseInt(session.user.id);
    
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

    const linesWithDetails = await getLinesForDubbing(projectId, userId);

    return (
        <div>
            <h1>Dublaj Atölyesi</h1>
            <p>
                Aşağıda, seslendirmeniz için onaylanmış ve size atanmış replikler listelenmektedir.
            </p>
            <hr style={{margin: '20px 0'}} />

            {linesWithDetails.length > 0 ? (
                <DubbingStudioClient lines={linesWithDetails} />
            ) : (
                <p>Size atanmış ve seslendirme için hazır bir replik bulunmuyor.</p>
            )}
        </div>
    );
}