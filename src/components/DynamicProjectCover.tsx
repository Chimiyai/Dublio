// src/components/DynamicProjectCover.tsx
'use client';

import dynamic from 'next/dynamic';

// Tipleri, beklenen propları yansıtacak şekilde güncelleyelim.
// Bu tiplerin, ProjectDetailCover.tsx dosyasındaki tiplerle aynı olması iyi olur.
interface ProjectDataForCover {
  title: string;
  bannerImagePublicId: string | null;
  trailerUrl?: string | null;
}

interface DynamicProjectCoverProps {
  project: ProjectDataForCover;
  playTrigger: boolean; // <<--- YENİ PROP
  onVideoStateChange: (isPlaying: boolean, hasError?: boolean) => void; // <<--- YENİ PROP
}

// ProjectDetailCover'ı dinamik olarak import et
const ProjectDetailCover = dynamic(() => import('@/components/ProjectDetailCover'), {
  ssr: false, // Sunucu tarafında render edilmeyecek, çünkü `window` gibi tarayıcı API'leri kullanabilir.
  loading: () => ( // Yüklenirken gösterilecek placeholder
    <div className="relative w-full aspect-video bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg flex items-center justify-center">
      <p className="text-white">Yükleniyor...</p>
    </div>
  ),
});

export default function DynamicProjectCover({ 
  project,
  playTrigger,      // <<--- Gelen prop'u al
  onVideoStateChange, // <<--- Gelen prop'u al
}: DynamicProjectCoverProps) {
  // Gelen propları olduğu gibi ProjectDetailCover'a aktar
  return (
    <ProjectDetailCover 
      project={project} 
      playTrigger={playTrigger} 
      onVideoStateChange={onVideoStateChange} 
    />
  );
}