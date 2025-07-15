// src/components/home/DubbedGamesSection.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ShowcaseCardData } from '@/types/showcase'; // Merkezi tipleri kullan
import ShowcaseSection from './ShowcaseSection';

// Bu tipler ve fonksiyon DubbedAnimeSection'daki ile aynı,
// idealde ortak bir 'services' veya 'lib' klasöründe olmalı.
interface CategoryInfo {
  id: number | string;
  name: string;
  slug: string;
}
interface ApiProjectData {
  id: string | number;
  title: string;
  slug: string;
  type: string;
  description?: string | null;
  coverImagePublicId?: string | null;
  bannerImagePublicId?: string | null;
  releaseDate?: string | Date | null;
  categories: { category: CategoryInfo }[];
  viewCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  averageRating?: number;
}

// Ortak veri çekme fonksiyonu
async function fetchTypedProjectsFromApi(projectType: 'oyun' | 'anime'): Promise<ApiProjectData[]> {
  try {
    const res = await fetch(`/api/projects?type=${projectType}`);
    if (!res.ok) {
      console.error(`Projeler (${projectType}) API'den yüklenemedi, status:`, res.status);
      return [];
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Fetch sırasında genel hata (${projectType}):`, error);
    return [];
  }
}

const DubbedGamesSection = () => {
  const [projects, setProjects] = useState<ApiProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchTypedProjectsFromApi('oyun'); // 'oyun' tipini belirt
        setProjects(data);
      } catch (err: any) {
        setError(err.message || "Oyun projeleri yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center text-dublio-text-dark">Oyunlar yükleniyor...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">Hata: {error}</div>;
  }

  const showcaseItems: ShowcaseCardData[] = projects.map(p => ({
    slug: p.slug,
    title: p.title,
    categories: p.categories.map(pc => pc.category),
    coverImageUrl: p.coverImagePublicId || '/images/placeholder-cover.jpg',
    bannerImageUrl: p.bannerImagePublicId || '/images/placeholder-banner.jpg',
    description: p.description || undefined,
  }));

  if (showcaseItems.length === 0 && !isLoading) {
     return <div className="container mx-auto py-8 text-center text-dublio-text-dark">Gösterilecek oyun projesi bulunamadı.</div>;
  }

  return (
    <ShowcaseSection
      sectionTitle="Dublajlanan Oyunlar"
      totalCount={showcaseItems.length}
      totalCountLabel="Toplam Dublajlanan Oyun Sayısı"
      items={showcaseItems}
      itemTypePath="oyunlar"
      swiperInstanceName="dubbed-games-swiper"
      dubRequestLink="/istek/oyun-dublaj"
    />
  );
};
export default DubbedGamesSection;