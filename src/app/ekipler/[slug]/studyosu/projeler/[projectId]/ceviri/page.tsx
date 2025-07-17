// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/ceviri/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TranslationStudioClient from '@/components/projects/TranslationStudioClient';
import { Prisma } from '@prisma/client';

// Bu tip tanımı doğru. Sadece veri çekerken bu tipe uyduğumuzdan emin olacağız.
export type LineForStudio = Prisma.TranslationLineGetPayload<{
    select: {
        id: true, sourceAssetId: true, key: true, originalText: true, translatedText: true, status: true, notes: true, voiceRecordingUrl: true, isNonDialogue: true, characterId: true, originalVoiceReferenceAssetId: true,
        character: { select: { id: true, name: true, profileImage: true } },
        originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } },
        sourceAsset: { select: { id: true, name: true, path: true, type: true } }
    }
}>;

async function getTranslationData(projectId: number): Promise<LineForStudio[]> {
    const allLines = await prisma.translationLine.findMany({
        where: {
            sourceAsset: {
                translatableAsset: { // Doğru yol
                    projectId: projectId,
                    isProcessed: true,
                }
            } 
        },
        select: { // İstemcinin beklediği tüm alanları seç
            id: true, sourceAssetId: true, key: true, originalText: true, translatedText: true, status: true, notes: true, voiceRecordingUrl: true, isNonDialogue: true, characterId: true, originalVoiceReferenceAssetId: true,
            character: { select: { id: true, name: true, profileImage: true } },
            originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } },
            sourceAsset: { select: { id: true, name: true, path: true, type: true } }
        },
        orderBy: { key: 'asc' }
    });
    return allLines;
}

export default async function TranslationStudioPage({ params }: { params: { projectId: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();
    const allLines = await getTranslationData(projectId);
    return (
        <div>
            <h1>Çeviri Stüdyosu</h1>
            <p>Projedeki tüm çevrilebilir metin satırları aşağıdadır.</p>
            <TranslationStudioClient initialLines={allLines} />
        </div>
    );
}
