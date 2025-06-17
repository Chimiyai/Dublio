'use client';

import { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { RoleInProject } from '@prisma/client';

interface ProjectDetailContentProps {
  project: {
    id: number;
    slug: string;
    title: string;
    type: 'oyun' | 'anime';
    description: string | null;
    bannerImagePublicId: string | null;
    coverImagePublicId: string | null;
    releaseDate: Date | null;
    trailerUrl?: string | null;
    price?: number | null;
    currency?: string | null;
    externalWatchUrl?: string | null;
    likeCount: number;
    dislikeCount: number;
    favoriteCount: number;
    averageRating?: number;
    assignments: Array<{
      id: number;
      role: RoleInProject;
      artist: { 
        id: number; 
        firstName: string; 
        lastName: string; 
        imagePublicId: string | null; 
        slug?: string | null; 
      };
      voiceRoles: Array<{ character: { id: number; name: string; } }>;
    }>;
    categories: Array<{ category: { name: string; slug: string } }>;
    _count: { comments?: number; ratings?: number };
  };
}

export default function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { title, description } = project;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sol Kart - Proje Bilgileri */}
      <div className="lg:w-2/3 space-y-8">
        {/* Proje Başlığı ve Beğeni Butonu */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full transition-colors duration-200 ${
              isLiked ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={isLiked ? 'Beğeniyi Kaldır' : 'Beğen'}
          >
            {isLiked ? (
              <HeartIconSolid className="w-6 h-6" />
            ) : (
              <HeartIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Proje Açıklaması */}
        {description && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Proje Açıklaması</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 leading-relaxed">
                {project.description?.substring(0,150) || "Açıklama mevcut değil."}{project.description && project.description.length > 150 ? "..." : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 