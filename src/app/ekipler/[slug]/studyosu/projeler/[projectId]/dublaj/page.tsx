// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/dublaj/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { TranslationStatus, Prisma } from '@prisma/client';
import DubbingStudioClient from '@/components/projects/DubbingStudioClient';

// ==========================================================
// === BÖLÜM 1: YENİ VE SAĞLAM TİP TANIMI ===
// ==========================================================
// Önce, temel veriyi "include" ile çekeceğimiz tipi tanımlıyoruz.
type LineWithRelations = Prisma.TranslationLineGetPayload<{
    include: {
        character: { select: { id: true, name: true, profileImage: true } },
        originalVoiceReferenceAsset: { select: { id: true, name: true, path: true } },
        // YENİ: Ham ses kaydı ilişkisini buraya ekliyoruz.
        rawRecording: { select: { url: true } }
    }
}>;

// Sonra, bu tipe manuel olarak "commentCount" eklediğimiz nihai tipi tanımlıyoruz.
export type LineForDubbingWithDetails = LineWithRelations & { commentCount: number };

// ==========================================================
// === BÖLÜM 2: İKİ AŞAMALI, PERFORMANSLI VERİ ÇEKME FONKSİYONU ===
// ==========================================================
async function getLinesForDubbing(projectId: number, userId: number): Promise<LineForDubbingWithDetails[]> {
  // --- AŞAMA 1: Ana verileri ve ilişkileri çek ---
  const lines = await prisma.translationLine.findMany({
    where: {
      sourceAsset: { projectId: projectId },
      character: { voiceActors: { some: { voiceActorId: userId } } },
      OR: [
        { status: TranslationStatus.APPROVED },
        { isNonDialogue: true }
      ]
    },
    include: {
        character: { select: { id: true, name: true, profileImage: true } },
        originalVoiceReferenceAsset: { select: { id: true, name: true, path: true } },
        // YENİ: Ham ses kaydı ilişkisini sorguya ekliyoruz.
        rawRecording: { select: { url: true } }
    },
    orderBy: { key: 'asc' }
  });

  // Eğer hiç satır yoksa, boşuna sorgu yapmadan hemen çık.
  if (lines.length === 0) {
    return [];
  }

  // --- AŞAMA 2: Tüm yorum sayılarını tek bir sorguda çek ---
  const lineIds = lines.map(line => line.id);
  const commentCounts = await prisma.comment.groupBy({
    by: ['targetId'],
    where: {
      targetType: 'TRANSLATION_LINE',
      targetId: { in: lineIds }
    },
    _count: {
      targetId: true
    }
  });

  // Hızlı erişim için sayıları bir Map'e dönüştür. { lineId => count }
  const commentCountsMap = new Map<number, number>();
  commentCounts.forEach(countGroup => {
    commentCountsMap.set(countGroup.targetId, countGroup._count.targetId);
  });

  // --- AŞAMA 3: İki veri setini birleştir ---
  const linesWithCommentCount = lines.map(line => ({
    ...line,
    // Map'ten yorum sayısını al, eğer yoksa 0 olarak kabul et.
    commentCount: commentCountsMap.get(line.id) || 0
  }));
  
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