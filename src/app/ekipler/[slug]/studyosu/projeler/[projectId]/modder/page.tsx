// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { Prisma } from '@prisma/client';
import ModderStudioClient from '@/components/projects/ModderStudioClient'; 

// Sorgu objesini ve tipi burada tutmaya devam edelim.
const projectForModderQuery = {
  include: {
    team: {
      include: { members: { include: { user: { select: { id: true, username: true, profileImage: true } } } } }
    },
    characters: {
      orderBy: { name: 'asc' },
      include: {
        voiceActors: {
          include: { voiceActor: { select: { id: true, username: true, profileImage: true } } }
        }
      }
    },
    assets: {
      orderBy: { id: 'asc' }
    },
  }
} as const;

export type ProjectForModderStudio = Prisma.ProjectGetPayload<typeof projectForModderQuery>;

async function getModderStudioData(projectId: number): Promise<ProjectForModderStudio | null> {
    return prisma.project.findUnique({
        where: { id: projectId },
        ...projectForModderQuery
    });
}

export default async function ModderStudioPage({ params }: { params: { projectId: string }}) {
    const session = await getServerSession(authOptions);
    const projectId = parseInt(params.projectId, 10);
    if (!session?.user?.id || isNaN(projectId)) return notFound();

    // === DÜZELTME: Gerekli tüm verileri paralel olarak çekiyoruz ===
    const [project, translationLines] = await Promise.all([
        getModderStudioData(projectId),
        // Çeviri satırlarını da burada çekiyoruz
        prisma.translationLine.findMany({
            where: { 
                sourceAsset: {
                    projectId: projectId 
                }
            }
        })
    ]);
    
    if (!project) return notFound();

    const membership = project.team.members.find(m => m.userId === parseInt(session.user.id));
    if (!membership || !['LEADER', 'ADMIN', 'MODDER'].includes(membership.role)) {
        return <p>Bu sayfayı sadece yetkili üyeler görebilir.</p>;
    }
    
    return (
        <div style={{color: 'white', padding: '20px'}}>
            <h1>Modder Stüdyosu: {project.name}</h1>
            {/* Component'e eksik olan `initialLines` prop'unu da gönderiyoruz */}
            <ModderStudioClient 
                project={project} 
                initialLines={translationLines} 
            />
        </div>
    );
}