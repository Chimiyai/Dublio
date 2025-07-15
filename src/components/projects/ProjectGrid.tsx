// src/components/projects/ProjectGrid.tsx
'use client';

import { ProjectForCard } from './ProjectsPageClient'; // ProjectsPageClient'ten gelen tip
import PopularContentCard from '@/components/ui/PopularContentCard'; // Kullanmak istediğimiz kart
import PopularContentCardPlaceholder from '@/components/ui/PopularContentCardPlaceholder'; // Yükleniyor durumu için
import { PhotoIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils'; // Tarih formatlama için bu fonksiyonun var olduğunu varsayıyoruz

interface ProjectGridProps {
  projects: ProjectForCard[];
  isLoading: boolean;
}

export default function ProjectGrid({ projects, isLoading }: ProjectGridProps) {
  // Yükleniyor durumu için iskelet (placeholder) göster
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-x-5 gap-y-8">
        {[...Array(8)].map((_, i) => (
          <PopularContentCardPlaceholder key={`placeholder-${i}`} />
        ))}
      </div>
    );
  }

  // Sonuç bulunamadı durumu
  if (projects.length === 0) {
    return (
      <div className="col-span-full text-center py-16">
        <PhotoIcon className="w-20 h-20 text-dublio-text-muted mx-auto mb-4" />
        <p className="text-xl font-semibold text-dublio-text-primary mb-2">Sonuç Bulunamadı</p>
        <p className="text-dublio-text-secondary">
          Filtrelerinize uygun proje bulunamadı. Lütfen filtrelerinizi değiştirmeyi deneyin.
        </p>
      </div>
    );
  }

  // Projeleri `PopularContentCard` ile listele
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-x-5 gap-y-8">
      {projects.map(project => (
        <PopularContentCard
          key={project.id}
          slug={project.slug}
          title={project.title}
          // `project.type` ('oyun'/'anime') string'ini `PopularContentCard`'ın beklediği
          // büyük harfli tipe ('Oyun'/'Anime') çeviriyoruz.
          type={project.type.charAt(0).toUpperCase() + project.type.slice(1) as 'Oyun' | 'Anime'}
          
          // Prop isimlerini doğru bir şekilde eşleştiriyoruz.
          bannerImageUrl={project.bannerImagePublicId}
          coverImageUrl={project.coverImagePublicId}
          description={project.description}
          date={project.releaseDate ? formatDate(new Date(project.releaseDate)) : "Bilinmiyor"}
          
          likes={project.likeCount}
          dislikes={project.dislikeCount}
          favorites={project.favoriteCount}
          
          price={project.price}
          currency={project.currency}

          itemTypePath="projeler" // Artık tüm linkler /projeler üzerinden
        />
      ))}
    </div>
  );
}