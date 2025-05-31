// src/components/games/ProjectGrid.tsx
'use client';

import { ProjectCardData } from './GamesPageClient'; // API'den gelen veri tipi
import PopularContentCard, { PopularContentCardProps } from '../ui/PopularContentCard'; // Mevcut kart component'in ve propları
import { formatDate } from '@/lib/utils'; // Tarih formatlama için
import { PhotoIcon } from '@heroicons/react/24/outline'; // Placeholder için (PopularContentCard içinde de olabilir)

interface ProjectGridProps {
  projects: ProjectCardData[];
  isLoading: boolean;
  type: 'oyun' | 'anime'; // Bu, itemTypePath ve placeholder tipi için kullanılacak
}

export default function ProjectGrid({ projects, isLoading, type }: ProjectGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-7">
        {[...Array(8)].map((_, i) => ( // Örnek 8 placeholder kart
          <div key={i} className="rounded-xl overflow-hidden bg-prestij-sidebar-bg shadow-lg animate-pulse">
            <div className="w-full aspect-[3/4] bg-prestij-input-bg flex items-center justify-center">
              {/* İsteğe bağlı: Placeholder ikonu */}
              {/* <PhotoIcon className="w-16 h-16 text-prestij-border-dark opacity-50" /> */}
            </div>
            <div className="p-4 space-y-3">
              <div className="h-5 bg-prestij-input-bg rounded w-3/4"></div>
              <div className="h-4 bg-prestij-input-bg rounded w-1/2"></div>
              <div className="flex items-center space-x-3 pt-2 mt-2 border-t border-prestij-input-bg/50">
                <div className="h-3 bg-prestij-input-bg rounded w-1/4"></div>
                <div className="h-3 bg-prestij-input-bg rounded w-1/4"></div>
                <div className="h-3 bg-prestij-input-bg rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="col-span-full text-center py-16">
        <PhotoIcon className="w-20 h-20 text-prestij-text-muted mx-auto mb-4" />
        <p className="text-xl font-semibold text-prestij-text-primary mb-2">Sonuç Bulunamadı</p>
        <p className="text-prestij-text-secondary">
          Filtrelerinize uygun {type === 'oyun' ? 'oyun' : 'anime'} bulunamadı. Lütfen filtrelerinizi değiştirmeyi deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-7">
      {projects.map(project => {
        // ProjectCardData'yı PopularContentCardProps'a dönüştür

        // description: ProjectCardData'dan gelen string | null | undefined olabilir.
        // PopularContentCardProps.description string | null bekliyor.
        // Eğer project.description undefined ise null'a çevir.
        const finalDescription: string | null = project.description === undefined ? null : project.description;

        // date: formatDate string | null dönebilir.
        // PopularContentCardProps.date string | null bekliyor.
        const formattedDate: string | null = project.releaseDate 
            ? formatDate(project.releaseDate, { day: 'numeric', month: 'short', year: 'numeric' }) 
            : null; // Eğer releaseDate yoksa veya formatDate null dönerse null olur.

        const cardProps: PopularContentCardProps = {
          slug: project.slug,
          title: project.title,
          type: project.type === 'oyun' ? 'Oyun' : 'Anime', // Büyük harfe çevir
          bannerImageUrl: project.bannerImagePublicId, // ProjectCardData'da bu alan opsiyonel ve string | null | undefined olabilir
          coverImageUrl: project.coverImagePublicId,   // ProjectCardData'da bu alan string | null | undefined olabilir
          description: finalDescription,
          date: formattedDate,
          likes: project.likeCount || 0,
          dislikes: project.dislikeCount || 0,
          favorites: project.favoriteCount || 0,
          itemTypePath: project.type === 'oyun' ? 'oyunlar' : 'animeler',
        };

        return (
          <PopularContentCard
            key={project.id}
            {...cardProps}
          />
        );
      })}
    </div>
  );
}