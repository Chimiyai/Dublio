// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/ceviri/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TranslationStudioClient from '@/components/projects/TranslationStudioClient';
import { Prisma } from '@prisma/client';

// Artık _count içermeyen, sadece temel alanları içeren bir tip tanımlıyoruz.
export type LineForStudio = Prisma.TranslationLineGetPayload<{
    select: {
        id: true,
        key: true,
        originalText: true,
        translatedText: true,
        status: true,
    }
}>;

async function getTranslationData(projectId: number): Promise<LineForStudio[]> {
    const allLines = await prisma.translationLine.findMany({
        where: {
            asset: {
                projectId: projectId,
                isProcessed: true
            }
        },
        // Sadece temel alanları seçiyoruz, _count yok.
        select: {
            id: true,
            key: true,
            originalText: true,
            translatedText: true,
            status: true,
        },
        orderBy: { key: 'asc' }
    });
    return allLines;
}

export default async function TranslationStudioPage({ params }: { params: { projectId: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();

    // Yetki kontrolü (gerekirse burada yapılabilir)
    
    const allLines = await getTranslationData(projectId);

    return (
        <div>
            <h1>Çeviri Stüdyosu</h1>
            <p>Projedeki tüm çevrilebilir metin satırları aşağıdadır.</p>
            <TranslationStudioClient initialLines={allLines} />
        </div>
    );
}