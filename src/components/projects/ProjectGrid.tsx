// src/components/projects/ProjectGrid.tsx
'use client';

import { ProjectForCard } from './ProjectsPageClient';
import PopularContentCard from '@/components/ui/PopularContentCard'; // Doğru yolu teyit et
import { PhotoIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';

interface ProjectGridProps {
  projects: ProjectForCard[];
  isLoading: boolean;
}

export default function ProjectGrid({ projects, isLoading }: ProjectGridProps) {
  if (isLoading && projects.length === 0) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
        {[...Array(8)].map((_, i) => (
          <div key={`loading-grid-${i}`} className="rounded-xl overflow-hidden bg-prestij-sidebar-bg shadow-lg animate-pulse">
            <div className="w-full aspect-[3/4] bg-prestij-input-bg"></div>
            <div className="p-4 space-y-3">
              <div className="h-5 bg-prestij-input-bg rounded w-3/4"></div>
              <div className="h-4 bg-prestij-input-bg rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && projects.length === 0) {
    return (
      <div className="col-span-full text-center py-16">
        <PhotoIcon className="w-20 h-20 text-prestij-text-muted mx-auto mb-4" />
        <p className="text-xl font-semibold text-prestij-text-primary mb-2">Sonuç Bulunamadı</p>
        <p className="text-prestij-text-secondary">
          Filtrelerinize uygun proje bulunamadı. Lütfen filtrelerinizi değiştirmeyi deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
      {projects.map(project => ( // 'project' objesi ProjectForCard tipinde
        <PopularContentCard
          key={project.id}
          slug={project.slug}
          title={project.title}
          type={project.type === 'oyun' ? 'Oyun' : 'Anime'}
          bannerImageUrl={project.bannerImagePublicId ?? null} // DİKKAT: project.bannerImagePublicId KULLANILIYOR
          coverImageUrl={project.coverImagePublicId}
          description={project.description ?? null}
          date={project.releaseDate ? formatDate(project.releaseDate, { day: 'numeric', month: 'short', year: 'numeric' }) : null}
          likes={project.likeCount || 0}
          dislikes={project.dislikeCount || 0}   // DİKKAT: project.dislikeCount KULLANILIYOR
          favorites={project.favoriteCount || 0} // DİKKAT: project.favoriteCount KULLANILIYOR
          itemTypePath="projeler"
          price={project.price}
          currency={project.currency}
        />
      ))}
    </div>
  );
}