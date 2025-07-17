// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { Prisma } from '@prisma/client';
import ModderPanelClient from '@/components/projects/ModderPanelClient'; // Yeni, temiz bileşenimiz

// Modder paneli için gerekli tüm veriyi çeken sorgu
const projectForModderQuery = {
    include: {
        team: {
            include: { members: { include: { user: true } } }
        },
        characters: {
            include: { voiceActors: { include: { voiceActor: true } } }
        },
        // DİKKAT: Artık `translationLines`'ı doğrudan değil, `assets` üzerinden çekiyoruz.
        assets: {
            orderBy: { createdAt: 'asc' },
            // Her bir asset için, o asset'ten türetilmiş çeviri satırlarını da çek.
            include: {
                sourcedTranslationLines: {
                    orderBy: { key: 'asc' },
                    include: {
                        character: true,
                        originalVoiceReferenceAsset: true,
                    }
                }
            }
        },
        // Bu satırı buradan kaldırıyoruz, çünkü yukarıya taşıdık.
        // translationLines: { ... } 
    }
} as const;

// Bu sorgudan dönecek verinin tipi
export type ProjectForModder = Prisma.ProjectGetPayload<typeof projectForModderQuery>;

async function getModderPanelData(projectId: number): Promise<ProjectForModder | null> {
    return prisma.project.findUnique({
        where: { id: projectId },
        ...projectForModderQuery
    });
}

export default async function ModderPanelPage({ params }: { params: { projectId: string }}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound();

    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();

    const project = await getModderPanelData(projectId);
    if (!project) return notFound();
    // Projedeki tüm asset'lerden gelen `translationLines` dizilerini tek bir diziye birleştiriyoruz.
    const allTranslationLines = project.assets.flatMap(asset => asset.sourcedTranslationLines);

    // Yetki Kontrolü
    const membership = project.team.members.find(m => m.userId === parseInt(session.user.id));
    if (!membership || !['LEADER', 'ADMIN', 'MODDER'].includes(membership.role)) {
        return <p>Bu sayfayı sadece Lider, Admin veya Modder rollerindeki üyeler görebilir.</p>;
    }
    
    return (
        <div>
            <h1>Modder Paneli</h1>
            {/* Client'a artık hem proje objesini hem de düzleştirilmiş satırları gönderiyoruz */}
            <ModderPanelClient project={project} initialLines={allTranslationLines} />
        </div>
    );
}