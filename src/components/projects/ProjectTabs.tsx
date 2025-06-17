// src/components/projects/ProjectTabs.tsx
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import CommentsSection from '@/components/project/CommentsSection';
import { ProjectDataForDetail } from '@/app/projeler/[slug]/page';
import { RoleInProject } from '@prisma/client';
import NextImage from 'next/image';
import Link from 'next/link';
import { UserCircleIcon, UsersIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { formatProjectRole } from '@/lib/utils';

// --- TİP TANIMLARI (ProjectTabs içinde kullanılanlar) ---
interface ArtistForCard {
  id: number;
  firstName: string;
  lastName: string;
  imagePublicId: string | null;
  slug?: string | null;
}
interface CharacterInfoForCard { id: number; name: string; }
interface VoiceRoleForCard { character: CharacterInfoForCard; }

// ----- ContributorsSection Alt Component'i (Eski Stile Göre Güncellendi) -----
function ContributorsSection({ assignments }: { assignments: ProjectDataForDetail['assignments'] }) {
    if (!assignments || assignments.length === 0) {
        return <p className="text-gray-400 py-8 text-center">Bu projeye henüz katkıda bulunan atanmamış.</p>;
    }

    const groupedAssignments = new Map<RoleInProject, typeof assignments>();
    assignments.forEach(assignment => {
        const roleKey = assignment.role;
        if (!groupedAssignments.has(roleKey)) {
            groupedAssignments.set(roleKey, []);
        }
        groupedAssignments.get(roleKey)!.push(assignment);
    });

    const roleOrder: RoleInProject[] = [
        RoleInProject.DIRECTOR, RoleInProject.SCRIPT_WRITER, RoleInProject.TRANSLATOR,
        RoleInProject.VOICE_ACTOR, RoleInProject.MIX_MASTER, RoleInProject.MODDER,
    ];

    // Map'i roleOrder'a göre sıralı bir array'e dönüştür
    const sortedGroupedRolesArray = Array.from(groupedAssignments.entries())
        .sort(([roleA], [roleB]) => {
            const indexA = roleOrder.indexOf(roleA);
            const indexB = roleOrder.indexOf(roleB);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

    return (
        <div className="space-y-10">
            {sortedGroupedRolesArray.map(([role, assignmentsInRole]) => {
                if (!assignmentsInRole || assignmentsInRole.length === 0) return null;
                return (
                    <div key={role}>
                        <h3 className="text-xl font-semibold mb-5 border-b border-gray-700 pb-2 text-indigo-400 dark:text-indigo-300">
                            {formatProjectRole(role)}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                            {assignmentsInRole.map((assignment) => {
                const artist = assignment.artist;
                const charactersPlayed = assignment.role === RoleInProject.VOICE_ACTOR && assignment.voiceRoles?.length > 0
                    ? assignment.voiceRoles.map(vr => vr.character.name).join(', ')
                    : null;
                const artistLink = artist.slug ? `/sanatcilar/${artist.slug}` : (artist.id ? `/sanatcilar/${artist.id}` : '#')

                return (
                  // SANATÇI KARTI (Eski GameTabs.tsx'teki class'lar ve yapı)
                  <Link key={assignment.id} href={artistLink} className="group flex items-center space-x-3 p-2.5 bg-gray-800/70 dark:bg-gray-800/50 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out hover:bg-gray-700/80 dark:hover:bg-gray-700/60"
                  >
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-gray-700 dark:border-gray-600 group-hover:border-indigo-500 transition-colors duration-150 relative">
                      {artist.imagePublicId ? (
                        <NextImage
                          src={getCloudinaryImageUrlOptimized(artist.imagePublicId, { width: 60, height: 60, crop: 'fill', gravity: 'face' }, 'avatar')}
                          alt={`${artist.firstName} ${artist.lastName}`}
                          fill className="object-cover" sizes="60px"
                        />
                      ) : (
                        <UserCircleIcon className="w-full h-full text-gray-500 p-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-100 dark:text-gray-50 group-hover:text-indigo-400 dark:group-hover:text-indigo-300 transition-colors duration-150 truncate">
                        {artist.firstName} {artist.lastName}
                      </p>
                      {charactersPlayed && (
                        <div className="w-full mt-0.5">
                          <p className="text-[10px] sm:text-xs text-purple-400 dark:text-purple-300 px-1 leading-tight whitespace-normal" title={charactersPlayed}>
                            <span className="font-semibold">K:</span> {charactersPlayed}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----- Ana ProjectTabs Component'i -----
interface ProjectTabsProps {
  project: ProjectDataForDetail;
}

type TabKey = 'contributors' | 'comments';

export default function ProjectTabs({ project }: ProjectTabsProps) {
  const tabsConfig: { key: TabKey; label: string; visible: boolean; icon?: React.ElementType }[] = [
    // Eski GameTabs'te açıklama sekmelerin üzerindeydi. Senin isteğin "Açıklama sekmesi eklensin ve diğerlerinin üzerinde (başında) bulunsun" idi.
    // Bu, açıklamanın İLK sekme olması anlamına geliyor.
    { key: 'contributors', label: 'Katkıda Bulunanlar', visible: !!project.assignments && project.assignments.length > 0, icon: UsersIcon },
    { key: 'comments', label: 'Yorumlar', visible: true, icon: ChatBubbleBottomCenterTextIcon },
  ];

  const visibleTabs = tabsConfig.filter(tab => tab.visible);

  const getDefaultActiveTab = (): TabKey => {
    if (project.assignments && project.assignments.length > 0) return 'contributors';
    return 'comments';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getDefaultActiveTab());

  useEffect(() => {
    const currentActiveTabIsVisible = visibleTabs.some(tab => tab.key === activeTab);
    if (!currentActiveTabIsVisible && visibleTabs.length > 0) {
      setActiveTab(getDefaultActiveTab());
    }
}, [visibleTabs, activeTab, project.assignments]);

  // Eski GameTabs'teki sekme buton stilleri
  const tabButtonBaseClass = "whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent dark:focus:ring-offset-[#101014] flex items-center gap-x-1.5";
  const tabButtonInactiveClass = "text-gray-400 hover:text-gray-200 hover:border-gray-500 dark:hover:border-gray-400 border-transparent";
  const tabButtonActiveClass = "text-purple-400 dark:text-purple-300 border-purple-500 dark:border-purple-400"; // Eski GameTabs'teki gibi

  if (visibleTabs.length === 0) { // Eğer hiç gösterilecek sekme yoksa (açıklama da yoksa) null dön.
    return null;
  }

  return (
    // Bu component'i çağıran yerde <section className="container mx-auto ..."> içine alınacak.
    // Eski GameTabs'te en dışta bir <section className="container mx-auto ..."> vardı.
    // O section'ı `/projeler/[slug]/page.tsx` içine taşıdık.
    // Bu yüzden buradaki en dış sarmalayıcı `div` olabilir.
    <div>
      {/* Sekme Başlıkları (Eski GameTabs'teki gibi) */}
      {/* Eski GameTabs'te açıklama bu sekme navigasyonunun üzerindeydi. */}
      {/* Senin isteğinle açıklamayı bir sekme yaptık. */}
      <div className="border-b border-gray-700 dark:border-gray-600 mb-8">
        <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto pb-px scrollbar-hide" aria-label="Tabs">
          {visibleTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  tabButtonBaseClass,
                  activeTab === tab.key ? tabButtonActiveClass : tabButtonInactiveClass
                )}
                role="tab"
                aria-selected={activeTab === tab.key}
              >
                {IconComponent && <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />} {/* İkon ve yazı arası boşluk */}
                <span>{tab.label}</span>
                {tab.key === 'comments' && project._count?.comments ? ` (${project._count.comments})` : ''}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Aktif Sekme İçeriği */}
      {/* Eski GameTabs'te bu div'in etrafında p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg gibi stiller yoktu,
          bu stiller açıklama bölümüne aitti. Sekme içerikleri daha sadeydi.
          İstersen buraya da benzer bir sarmalayıcı ekleyebiliriz veya sade bırakabiliriz.
          Şimdilik sade bırakıyorum.
      */}
      <div className="mt-2">
        {activeTab === 'comments' && <CommentsSection projectId={project.id} initialTotalComments={project._count?.comments || 0} />}
        {activeTab === 'contributors' && <ContributorsSection assignments={project.assignments} />}
      </div>
    </div>
  );
}