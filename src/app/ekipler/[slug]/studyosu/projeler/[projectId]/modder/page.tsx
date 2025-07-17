// src/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page.tsx

import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import ModderPanelPageClient from '@/components/projects/ModderPanelPageClient';
import { Prisma } from '@prisma/client';

// === TİP TANIMLARI YENİ MİMARİYE GÖRE GÜNCELLENDİ ===

export type CharacterWithVoiceActors = Prisma.CharacterGetPayload<{
  include: { voiceActors: { include: { voiceActor: { select: { id: true, username: true, profileImage: true } } } } }
}>;

// AssetForModder tipi artık proje bazlı ayarları içermeli.
// Bu tip, hem Asset'in kendisini hem de o projeye özel 'isNonDialogue' bilgisini birleştirir.
export type ProjectAssetSettingWithAsset = Prisma.ProjectAssetSettingGetPayload<{
    include: { asset: true }
}>;

// TranslationLine tipi aynı kalabilir, çünkü yapısı değişmedi.
export type TranslationLineForModder = Prisma.TranslationLineGetPayload<{
  select: {
    id: true; sourceAssetId: true; key: true; originalText: true; translatedText: true; status: true; notes: true; voiceRecordingUrl: true; characterId: true; originalVoiceReferenceAssetId: true; isNonDialogue: true;
    character: { select: { id: true, name: true, profileImage: true } };
    originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } }; // isNonDialogue artık burada değil
    sourceAsset: { select: { id: true, name: true, path: true, type: true } };
  }
}>;

// === VERİ ÇEKME FONKSİYONU YENİ MİMARİYE GÖRE GÜNCELLENDİ ===
async function getModderPanelData(projectId: number, userId: number) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            name: true,
            team: {
                select: {
                    members: {
                        where: { role: { in: ['LEADER', 'MEMBER', 'ADMIN', 'MODDER'] } },
                        include: { user: { select: { id: true, username: true, profileImage: true } } }
                    },
                }
            },
            characters: {
                include: {
                    voiceActors: { include: { voiceActor: { select: { id: true, username: true, profileImage: true } } } }
                },
                orderBy: { name: 'asc' }
            },
            // DİKKAT: Artık doğrudan `assets` çekmiyoruz.
            // Bunun yerine `projectAssetSettings` çekiyoruz.
            projectAssetSettings: {
                where: { asset: { type: 'AUDIO' } }, // Sadece ses assetlerinin ayarlarını al
                include: {
                    asset: true // Ayara bağlı olan asset'in kendisini de al
                },
                orderBy: { asset: { createdAt: 'asc' } }
            },
            // TranslationLine'ları çekme mantığı aynı kalabilir.
            translatableAssets: {
                include: {
                    asset: {
                        include: {
                            sourcedTranslationLines: {
                                select: {
                                    id: true, sourceAssetId: true, key: true, originalText: true, translatedText: true, status: true, notes: true, voiceRecordingUrl: true, characterId: true, originalVoiceReferenceAssetId: true, isNonDialogue: true,
                                    character: { select: { id: true, name: true, profileImage: true } },
                                    originalVoiceReferenceAsset: { select: { id: true, name: true, path: true, type: true } },
                                    sourceAsset: { select: { id: true, name: true, path: true, type: true } },
                                },
                                orderBy: { key: 'asc' }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!project) return { project: null, viewerMembership: null, allLines: [], audioAssetSettings: [] };

    // Tüm satırları tek bir diziye topla
    const allLines = project.translatableAssets.flatMap(ta => ta.asset.sourcedTranslationLines) as TranslationLineForModder[];
    
    const viewerMembership = project.team.members.find(m => m.userId === userId) || null;

    return { 
        project, 
        viewerMembership, 
        allLines, 
        audioAssetSettings: project.projectAssetSettings // Client'a yeni veriyi yolluyoruz
    };
}


export default async function ModderPanelPage({ params }: { params: { projectId: string, slug: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound();
    const userId = parseInt(session.user.id);

    const { project, viewerMembership, allLines, audioAssetSettings } = await getModderPanelData(projectId, userId);

    if (!project || !viewerMembership) {
        return notFound();
    }

    if (!['LEADER', 'ADMIN', 'MODDER'].includes(viewerMembership.role)) {
        return (
            <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>
                <h1>Erişim Reddedildi</h1>
                <p>Bu panele sadece ekip Liderleri, Adminler veya Modderlar erişebilir.</p>
            </div>
        );
    }
    
    // === Client bileşenine yeni prop'ları gönderiyoruz ===
    return (
        <ModderPanelPageClient
            projectId={project.id}
            viewerRole={viewerMembership.role}
            initialCharacters={project.characters}
            allTeamMembers={project.team.members}
            // `initialAudioAssets` yerine yeni prop'umuzu gönderiyoruz.
            initialAssetSettings={audioAssetSettings}
            allTranslationLines={allLines}
        />
    );
}