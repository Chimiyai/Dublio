// src/components/game/GameTabs.tsx
'use client';

import { useState } from 'react';
import CommentsSection from '@/components/project/CommentsSection'; // Yorumlar
// import ContributorsSection from './ContributorsSection'; // Gelecekte
// import GallerySection from './GallerySection'; // Gelecekte
import { cn } from '@/lib/utils';
import { Project, DubbingArtist, RoleInProject } from '@prisma/client'; // Tipler için
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary'; // YENİ: Cloudinary fonksiyonunu import et
import { UserCircleIcon } from '@heroicons/react/24/outline'; // YENİ: İkonu import et
import NextImage from 'next/image';

// Katkıda Bulunanlar için tip (ArtistAvatar ve ProjectDetailCover gibi componentler kullanıyorduk)
type ArtistForProjectDetail = Pick<DubbingArtist, "id" | "firstName" | "lastName" | "imagePublicId">;
type GameDataForTabs = Project & { // gameData prop'u için tip
    assignments: Array<{
        role: RoleInProject;
        artist: ArtistForProjectDetail;
    }>;
    // categories: Array<{ category: { name: string; slug: string } }>; // gerekirse
};


function ContributorsSection({ assignments }: { assignments: GameDataForTabs['assignments'] }) {
  if (!assignments || assignments.length === 0) {
    return <p className="text-gray-400">Bu projeye henüz kimse atanmamış.</p>;
  }

  const formatRole = (role: RoleInProject | string) => {
    return role.toString().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const roleKey = assignment.role.toString();
    if (!acc[roleKey]) {
      acc[roleKey] = [];
    }
    acc[roleKey].push(assignment.artist);
    return acc;
  }, {} as Record<string, ArtistForProjectDetail[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedAssignments).map(([role, artistsArray]) => (
        <div key={role}>
          <h4 className="text-md font-semibold mb-3 text-indigo-400">
            {formatRole(role)}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artistsArray.map((artist) => (
              <a key={artist.id} href={`/sanatcilar/${artist.id}`} className="block group text-center p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 rounded-full overflow-hidden border border-gray-700 group-hover:border-indigo-500 flex items-center justify-center bg-gray-700 relative"> {/* relative eklendi */}
                  {artist.imagePublicId ? (
                     <NextImage // Alias'ı kullan
                        src={getCloudinaryImageUrlOptimized(artist.imagePublicId, {width: 80, height: 80, crop: 'fill', gravity: 'face'}, 'avatar')}
                        alt={`${artist.firstName} ${artist.lastName}`}
                        fill
                        className="object-cover rounded-full"
                        sizes="(max-width: 640px) 64px, 80px" // Örnek sizes prop'u
                     />
                  ) : <UserCircleIcon className="w-10 h-10 text-gray-500"/>}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-indigo-300 truncate">
                  {artist.firstName} {artist.lastName}
                </p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GallerySectionPlaceholder() {
    return <p className="text-gray-400">Resim galerisi yakında eklenecek.</p>;
}


interface GameTabsProps {
  gameId: number;
  initialCommentCount: number;
  gameData: GameDataForTabs; // Katkıda bulunanlar için tüm game objesini alalım
}

type TabKey = 'comments' | 'contributors' | 'gallery';

export default function GameTabs({ gameId, initialCommentCount, gameData }: GameTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('comments');

  const tabs: { key: TabKey; label: string; icon?: React.ElementType }[] = [
    { key: 'comments', label: 'Yorumlar' },
    { key: 'contributors', label: 'Katkıda Bulunanlar' },
    { key: 'gallery', label: 'Resimler' },
  ];

  const tabButtonBaseClass = "whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors";
  const tabButtonInactiveClass = "text-gray-400 hover:text-gray-200 hover:border-gray-400 border-transparent";
  const tabButtonActiveClass = "text-purple-400 border-purple-500";

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="border-b border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
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

      <div className="mt-2">
        {activeTab === 'comments' && <CommentsSection projectId={gameId} initialTotalComments={initialCommentCount} />}
        {activeTab === 'contributors' && <ContributorsSection assignments={gameData.assignments} />}
        {activeTab === 'gallery' && <GallerySectionPlaceholder />}
      </div>
    </section>
  );
}
