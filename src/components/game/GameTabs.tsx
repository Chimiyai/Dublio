// src/components/game/GameTabs.tsx
'use client';

import { useState } from 'react';
import CommentsSection from '@/components/project/CommentsSection';
import { cn } from '@/lib/utils';
import { 
    Project as PrismaProject, 
    DubbingArtist as PrismaDubbingArtist, 
    RoleInProject as PrismaRoleInProject, 
    ProjectAssignment as PrismaProjectAssignment, // ProjectAssignment tipini de alalım
    // ProjectCharacter as PrismaProjectCharacter, // Gerekirse
    // VoiceAssignment as PrismaVoiceAssignment // Gerekirse
} from '@prisma/client';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import NextImage from 'next/image';
import { formatProjectRole } from '@/lib/utils';

// --- TİP TANIMLARI ---
// Bu tipler, getGameDetails'ten gelen verinin yapısını yansıtmalı

interface ArtistForCard { // Sanatçı kartında gösterilecek temel bilgiler
  id: number;
  firstName: string;
  lastName: string;
  imagePublicId: string | null;
}

export interface CharacterInfoForCard { // Karakter bilgisi
  id: number;
  name: string;
}

export interface VoiceRoleForCard { // Bir seslendirme rolünün detayı
  character: CharacterInfoForCard;
  // VoiceAssignment'tan başka notlar vb. eklenebilir
}

// Bir proje atamasının tüm detayları (sanatçı, rol ve seslendirme rolleri)
export interface AssignmentWithDetails {
  id: number; // ProjectAssignment ID
  role: PrismaRoleInProject;
  artist: ArtistForCard;
  voiceRoles: VoiceRoleForCard[]; // Bu atamaya bağlı seslendirilmiş karakterler
}

export interface CategoryForGamePage { // game.categories için tip
    category: {
        name: string;
        slug: string; // slug da geliyordu sanırım
    }
}
// GameTabs component'ine prop olarak geçecek ana veri tipi
// Bu tip, `getGameDetails` fonksiyonundan dönen `project` objesinin yapısıyla eşleşmeli.
export interface GameDataForTabs {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  // YENİ EKLENEN ALANLAR:
  bannerImagePublicId: string | null;
  coverImagePublicId: string | null;
  releaseDate: Date | string | null; // Prisma'dan Date, format sonrası string olabilir
  price: number | null;
  currency: string | null;
  likeCount: number; // Varsayılan olarak 0 olabilir, Prisma şemasında default(0)
  dislikeCount: number;
  favoriteCount: number;
  // type: string; // 'oyun' veya 'anime', eğer gerekliyse eklenebilir
  categories: CategoryForGamePage[]; // Güncellenmiş kategori tipi
  
  assignments: AssignmentWithDetails[];
  _count?: { comments?: number | null } | null;
}


// --- COMPONENTLER ---

function ContributorsSection({ assignments }: { assignments: AssignmentWithDetails[] }) {
  if (!assignments || assignments.length === 0) {
    return <p className="text-gray-400 py-4">Bu projeye henüz kimse atanmamış.</p>;
  }

  const formatRole = (role: PrismaRoleInProject): string => {
    return role.toString().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Atamaları role göre grupla
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const roleKey = assignment.role;
    if (!acc[roleKey]) {
      acc[roleKey] = [];
    }
    acc[roleKey].push(assignment); // Tüm assignment objesini ekle
    return acc;
  }, {} as Record<PrismaRoleInProject, AssignmentWithDetails[]>);

  // Rollerin gösterim sırasını belirleyebiliriz (isteğe bağlı)
  const roleOrder: PrismaRoleInProject[] = [
  PrismaRoleInProject.DIRECTOR,
  PrismaRoleInProject.SCRIPT_WRITER,
  PrismaRoleInProject.MODDER,
  PrismaRoleInProject.TRANSLATOR,
  PrismaRoleInProject.MIX_MASTER,
  PrismaRoleInProject.VOICE_ACTOR,
];
  
  const sortedRoles = Object.keys(groupedAssignments)
    .filter(role => roleOrder.includes(role as PrismaRoleInProject)) // Sadece roleOrder'da olanları al
    .sort((a, b) => {
        const indexA = roleOrder.indexOf(a as PrismaRoleInProject);
        const indexB = roleOrder.indexOf(b as PrismaRoleInProject);
        return indexA - indexB;
    }) as PrismaRoleInProject[];

  // Eğer roleOrder'da olmayan ama groupedAssignments'ta olan roller varsa, onları sona ekle (opsiyonel)
  const otherRoles = Object.keys(groupedAssignments)
    .filter(role => !roleOrder.includes(role as PrismaRoleInProject)) as PrismaRoleInProject[];
  
  const finalSortedRoles = [...sortedRoles, ...otherRoles]; // Önce sıralılar, sonra diğerleri

  return (
    <div className="space-y-10">
      {finalSortedRoles.map((role) => {
        const assignmentsInRole = groupedAssignments[role];
        if (!assignmentsInRole || assignmentsInRole.length === 0) return null;

        return (
          <div key={role}>
            <h3 className="text-xl font-semibold mb-5 border-b border-gray-700 pb-2 text-indigo-400">
              {formatProjectRole(role)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
              {assignmentsInRole.map((assignment) => {
                const artist = assignment.artist;
                const charactersPlayed =
                  assignment.role === PrismaRoleInProject.VOICE_ACTOR && assignment.voiceRoles && assignment.voiceRoles.length > 0
                    ? assignment.voiceRoles.map(vr => vr.character.name).join(', ')
                    : null;

                return (
                  <a
                    key={`${assignment.id}-${artist.id}`} // veya sadece assignment.id
                    href={`/sanatcilar/${artist.id}`}
                    className="group flex items-center space-x-3 p-2.5 bg-gray-800/70 dark:bg-gray-800/50 rounded-lg shadow hover:shadow-md transition-all duration-150 ease-in-out hover:bg-gray-700/80 dark:hover:bg-gray-700/60" // space-x-3 eklendi, padding ayarlandı
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-gray-700 dark:border-gray-600 group-hover:border-indigo-500 transition-colors duration-150 relative">
                      {artist.imagePublicId ? (
                        <NextImage
                          src={getCloudinaryImageUrlOptimized(artist.imagePublicId, { width: 60, height: 60, crop: 'fill', gravity: 'face' }, 'avatar')} // Boyutlar küçültüldü
                          alt={`${artist.firstName} ${artist.lastName}`}
                          fill
                          className="object-cover"
                          sizes="60px" // Yeni boyuta göre
                        />
                      ) : (
                        <UserCircleIcon className="w-full h-full text-gray-500 p-0.5" />
                      )}
                    </div>

                    {/* İsim ve Rol/Karakter Bilgisi (Yan Yana) */}
                    <div className="flex-1 min-w-0"> {/* min-w-0 taşmayı önlemek için önemli */}
                      <p className="text-sm font-semibold text-gray-100 dark:text-gray-50 group-hover:text-indigo-400 dark:group-hover:text-indigo-300 transition-colors duration-150 truncate">
                        {artist.firstName} {artist.lastName}
                      </p>
                      {/* Rol ve Karakter Bilgisi Alt Alta */}
                      <div>
                        {charactersPlayed && (
  <div className="w-full mt-0.5">
    <p 
      className="text-[10px] sm:text-xs text-purple-400 dark:text-purple-300 px-1 leading-tight whitespace-normal" 
      title={charactersPlayed}
    >
      <span className="font-semibold">K:</span> {charactersPlayed}
    </p>
  </div>
)}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GallerySectionPlaceholder() {
  return <p className="text-gray-400 py-4">Resim galerisi bu proje için henüz mevcut değil.</p>;
}

interface GameTabsProps {
  gameId: number;
  initialCommentCount: number;
  gameData: GameDataForTabs; // Güncellenmiş tip
}

type TabKey = 'contributors' | 'comments' | 'gallery'; // Sıra değiştirildi

export default function GameTabs({ gameId, initialCommentCount, gameData }: GameTabsProps) {
  // Varsayılan aktif sekme "Katkıda Bulunanlar"
  const [activeTab, setActiveTab] = useState<TabKey>('contributors');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'contributors', label: 'Katkıda Bulunanlar' },
    { key: 'comments', label: 'Yorumlar' },
    { key: 'gallery', label: 'Resimler' },
  ];

  const tabButtonBaseClass = "whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out";
  const tabButtonInactiveClass = "text-gray-400 hover:text-gray-200 hover:border-gray-500 dark:hover:border-gray-400 border-transparent";
  const tabButtonActiveClass = "text-purple-400 dark:text-purple-300 border-purple-500 dark:border-purple-400";

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Oyun Açıklaması */}
      {gameData.description && (
        <div className="mb-10 md:mb-12 p-6 bg-gray-800/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-gray-700 pb-3">
            Oyun Açıklaması
          </h2>
          <div 
            dangerouslySetInnerHTML={{ __html: gameData.description.replace(/\n/g, '<br />') }} 
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-gray-300 dark:text-gray-300 leading-relaxed" 
          />
        </div>
      )}

      {/* Sekme Başlıkları */}
      <div className="border-b border-gray-700 dark:border-gray-600 mb-8">
        <nav className="-mb-px flex space-x-6 sm:space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                tabButtonBaseClass,
                activeTab === tab.key ? tabButtonActiveClass : tabButtonInactiveClass
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Aktif Sekme İçeriği */}
      <div className="mt-2">
        {activeTab === 'comments' && <CommentsSection projectId={gameId} initialTotalComments={initialCommentCount} />}
        {activeTab === 'contributors' && <ContributorsSection assignments={gameData.assignments} />}
        {activeTab === 'gallery' && <GallerySectionPlaceholder />}
      </div>
    </section>
  );
}