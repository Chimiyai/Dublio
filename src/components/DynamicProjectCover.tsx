// src/components/DynamicProjectCover.tsx
'use client'; // Bu satır component'i Client Component yapar

import dynamic from 'next/dynamic';

// Project tipini import et veya burada tanımla
// ProjectDetailCover'ın beklediği props tipini de import et veya tanımla
// Örnek olarak ProjectData diyelim:
interface ProjectData {
  title: string;
  bannerImagePublicId: string | null;
  trailerUrl?: string | null;
  // ... ProjectDetailCover'ın ihtiyaç duyduğu diğer alanlar
}

interface DynamicProjectCoverProps {
  project: ProjectData;
}

const ProjectDetailCover = dynamic(() => import('@/components/ProjectDetailCover'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full aspect-video bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg flex items-center justify-center">
      <p className="text-white">Fragman Bölümü Yükleniyor...</p>
    </div>
  ),
});

export default function DynamicProjectCover({ project }: DynamicProjectCoverProps) {
  return <ProjectDetailCover project={project} />;
}