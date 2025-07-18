// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/ceviri/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TranslationStudioClient from '@/components/projects/TranslationStudioClient';
import { Prisma } from '@prisma/client';

// DÜZELTME: "select" bloğuna eksik tüm alanlar eklendi.
export type LineForStudio = Prisma.TranslationLineGetPayload<{
    select: {
        id: true,
        key: true,
        originalText: true,
        translatedText: true,
        status: true,
        isNonDialogue: true,
        notes: true,
        voiceRecordingUrl: true,
        sourceAssetId: true,
        characterId: true,
        originalVoiceReferenceAssetId: true,
        character: { 
            select: { id: true, name: true, profileImage: true } 
        },
        originalVoiceReferenceAsset: { 
            select: { id: true, name: true, path: true, type: true } 
        },
        sourceAsset: { 
            select: { id: true, name: true, path: true, type: true } 
        }
        // _count ve comments kaldırıldı
    }
}>;

// Yorum sayısını döndüren yardımcı fonksiyon
async function getCommentCountForLine(lineId: number) {
    return prisma.comment.count({
        where: {
            targetType: 'TRANSLATION_LINE',
            targetId: lineId
        }
    });
}

async function getDialogueLines(projectId: number): Promise<(LineForStudio & { commentCount: number })[]> {
    const lines = await prisma.translationLine.findMany({
        where: {
            sourceAsset: { project: { id: projectId, isReadyForTranslation: true } },
            characterId: { not: null },
            originalVoiceReferenceAssetId: { not: null }
        },
        select: {
            id: true, key: true, originalText: true, translatedText: true, status: true, isNonDialogue: true, notes: true, voiceRecordingUrl: true, sourceAssetId: true, characterId: true, originalVoiceReferenceAssetId: true,
            character: { select: { id: true, name: true, profileImage: true } },
            originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } },
            sourceAsset: { select: { id: true, name: true, path: true, type: true } }
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

async function getUiAndTextLines(projectId: number): Promise<(LineForStudio & { commentCount: number })[]> {
    const lines = await prisma.translationLine.findMany({
        where: {
            sourceAsset: { project: { id: projectId, isReadyForTranslation: true } },
            characterId: null
        },
        select: {
            id: true, key: true, originalText: true, translatedText: true, status: true, isNonDialogue: true, notes: true, voiceRecordingUrl: true, sourceAssetId: true, characterId: true, originalVoiceReferenceAssetId: true,
            character: { select: { id: true, name: true, profileImage: true } },
            originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } },
            sourceAsset: { select: { id: true, name: true, path: true, type: true } }
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

export default async function TranslationStudioPage({ params }: { params: { projectId: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();
    
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { isReadyForTranslation: true }
    });

    if (!project) return notFound();

    if (!project.isReadyForTranslation) {
        return (
            <div>
                <h1>Çeviri Stüdyosu</h1>
                <p style={{marginTop: '20px', padding: '20px', background: '#333', borderRadius: '8px'}}>
                    Bu proje henüz çeviriye hazır değil.
                    <br />
                    Proje hazırlayıcısı (Modder) tüm dosyaları ve atamaları tamamladıktan sonra bu sayfa aktif olacaktır.
                </p>
            </div>
        );
    }
    
    // İki sorguyu paralel olarak çalıştırarak performansı artırıyoruz.
    const [dialogueLines, uiLines] = await Promise.all([
        getDialogueLines(projectId),
        getUiAndTextLines(projectId)
    ]);
    
    return (
        <div>
            <h1>Çeviri Stüdyosu</h1>
            <p>Çevrilecek diyaloglar ve arayüz metinleri aşağıdadır.</p>
            <TranslationStudioClient 
                initialDialogueLines={dialogueLines} 
                initialUiLines={uiLines} 
            />
        </div>
    );
}