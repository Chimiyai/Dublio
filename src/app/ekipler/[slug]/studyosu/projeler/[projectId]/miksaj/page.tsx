//src/app/ekipler/[slug]/studyosu/projeler/[projectId]/miksaj/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { VoiceRecordingStatus, Prisma } from '@prisma/client';
import MixStudioClient from '@/components/projects/MixStudioClient'; // Bunu birazdan oluşturacağız

// ==========================================================
// === BÖLÜM 1: MİKSAJ ATÖLYESİ İÇİN VERİ TİPİ TANIMI ===
// ==========================================================
export type LineForMixing = Prisma.TranslationLineGetPayload<{
    select: {
        id: true,
        key: true,
        translatedText: true,
        isNonDialogue: true,
        recordingStatus: true,
        character: { 
            select: { id: true, name: true, profileImage: true } 
        },
        originalVoiceReferenceAsset: { 
            select: { id: true, name: true, path: true } // DÜZELTME: 'metadata' kaldırıldı.
        },
        rawRecording: { 
            select: { id: true, url: true, createdAt: true, uploadedBy: { select: { username: true } } }
        }
    }
}>;

// ==========================================================
// === BÖLÜM 2: VERİ ÇEKME FONKSİYONU ===
// ==========================================================
async function getLinesForMixing(projectId: number): Promise<LineForMixing[]> {
  return prisma.translationLine.findMany({
    where: {
      sourceAsset: {
        projectId: projectId
      },
      recordingStatus: VoiceRecordingStatus.PENDING_MIX
    },
    // DÜZELTME: Tüm gerekli alanları içeren doğru select bloğu
    select: {
        id: true,
        key: true,
        translatedText: true,
        isNonDialogue: true,
        recordingStatus: true,
        character: { select: { id: true, name: true, profileImage: true } },
        originalVoiceReferenceAsset: { select: { id: true, name: true, path: true } }, // DÜZELTME: 'metadata' kaldırıldı.
        rawRecording: { 
            select: { id: true, url: true, createdAt: true, uploadedBy: { select: { username: true } } }
        }
    },
    orderBy: { key: 'asc' }
  });
}

// ==========================================================
// === BÖLÜM 3: SAYFA COMPONENT'İ ===
// ==========================================================

export default async function MixStudioPage({ params }: { params: { projectId: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound();
    
    // TODO: Yetki kontrolü - Kullanıcı bu projenin ses mühendisi mi?

    const linesForMixing = await getLinesForMixing(projectId);

    return (
        <div>
            <h1>Ses Miksaj & Mastering Atölyesi</h1>
            <p>
                Aşağıda, seslendirmenler tarafından kaydedilmiş ve işlenmeyi bekleyen ham ses kayıtları bulunmaktadır.
            </p>
            <hr style={{margin: '20px 0'}} />

            {linesForMixing.length > 0 ? (
                <MixStudioClient initialLines={linesForMixing} />
            ) : (
                <p>Miksaj için bekleyen bir ses kaydı bulunmuyor.</p>
            )}
        </div>
    );
}