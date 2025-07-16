//src/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import ModderPanelPageClient from '@/components/projects/ModderPanelPageClient'; // İstemci bileşeni
import { Prisma, ProjectStatus } from '@prisma/client';

// Modder panelinde göstereceğimiz karakterler için tip
export type CharacterWithVoiceActors = Prisma.CharacterGetPayload<{
  include: {
    voiceActors: {
      include: { voiceActor: { select: { id: true, username: true, profileImage: true } } }
    }
  }
}>;

// Modder panelinde göstermek için tüm Asset'ler (ses dosyaları)
export type AssetForModder = Prisma.AssetGetPayload<{
  select: {
    id: true;
    name: true;
    path: true;
    type: true;
  }
}>;

// Modder panelinde göstermek için çeviri satırları
export type TranslationLineForModder = Prisma.TranslationLineGetPayload<{
  select: {
    id: true;
    key: true;
    originalText: true;
    translatedText: true;
    status: true;
    characterId: true;
    originalVoiceAssetId: true;
  }
}>;

// Modder paneli için tüm gerekli veriyi çekecek fonksiyon
async function getModderPanelData(projectId: number, userId: number) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            teamId: true,
            characters: { 
                include: {
                    voiceActors: { include: { voiceActor: { select: { id: true, username: true, profileImage: true } } } }
                },
                orderBy: { name: 'asc' }
            },
            team: {
                select: {
                    members: { include: { user: { select: { id: true, username: true, profileImage: true } } } },
                }
            },
            // YENİ: Projeye ait asset'leri (ses) çek
            assets: {
                where: { type: 'AUDIO' }, // Sadece ses dosyalarını çekelim
                select: { id: true, name: true, path: true, type: true },
                orderBy: { createdAt: 'asc' }
            },
            // YENİ: Projeye ait çeviri satırlarını çek
            translatableAssets: {
                include: {
                    lines: {
                        select: { id: true, key: true, originalText: true, translatedText: true, status: true, characterId: true, originalVoiceAssetId: true },
                        orderBy: { key: 'asc' }
                    }
                }
            }
        }
    });

    // Kullanıcının bu projedeki rolünü bul
    const viewerMembership = project?.team.members.find(m => m.userId === userId);
    
    // Tüm çeviri satırlarını tek bir diziye topla (daha kolay işlemek için)
    const allLines = project?.translatableAssets.flatMap(asset => asset.lines) || [];

    return { project, viewerMembership, allLines };
}

export default async function ModderPanelPage({ params }: { params: { projectId: string, slug: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound();
    const userId = parseInt(session.user.id);

    const { project, viewerMembership, allLines } = await getModderPanelData(projectId, userId);
    if (!project || !viewerMembership) return notFound();

    // Yetki kontrolü (sadece Modder, Lider veya Admin erişebilir)
    if (!['LEADER', 'ADMIN', 'MODDER'].includes(viewerMembership.role)) {
        return (
            <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>
                <h1>Erişim Reddedildi</h1>
                <p>Bu panele sadece ekip Liderleri, Adminler veya Modderlar erişebilir.</p>
            </div>
        );
    }

    return (
        <ModderPanelPageClient
            projectId={project.id}
            viewerRole={viewerMembership.role}
            initialCharacters={project.characters}
            allTeamMembers={project.team.members}
            allAudioAssets={project.assets} // YENİ PROP
            allTranslationLines={allLines} // YENİ PROP
        />
    );
}