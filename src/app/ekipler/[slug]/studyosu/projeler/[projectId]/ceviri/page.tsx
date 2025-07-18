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
    // 1. Sorgunun sonucunu 'allLines' adında bir değişkene ata.
    const allLines = await prisma.translationLine.findMany({
        where: {
            sourceAsset: {
                projectId: projectId
            },
            characterId: {
                not: null
            },
            originalVoiceReferenceAssetId: {
                not: null
            }
        },
        select: {
            id: true,
            sourceAssetId: true,
            key: true,
            originalText: true,
            translatedText: true,
            status: true,
            notes: true,
            voiceRecordingUrl: true,
            isNonDialogue: true,
            characterId: true,
            originalVoiceReferenceAssetId: true,
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
    
    // Değişken adını daha net hale getirelim ki karışıklık olmasın.
    const linesForStudio = await getTranslationData(projectId);
    
    return (
        <div>
            <h1>Çeviri Stüdyosu</h1>
            <p>Projedeki tüm çevrilebilir metin satırları aşağıdadır.</p>
            {/* Component'e doğru değişkeni verdiğimizden emin oluyoruz. */}
            <TranslationStudioClient initialLines={linesForStudio} />
        </div>
    );
}
