// src/components/home/DubbedAnimeSection.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ApiProject, ShowcaseCardData } from '@/types/showcase'; // Merkezi tipleri kullan
import ShowcaseSection from './ShowcaseSection';

// Bu tipler ve fonksiyon DubbedGamesSection'daki ile aynı,
// idealde ortak bir 'services' veya 'lib' klasöründe olmalı.
// Şimdilik kopyalıyorum, sonra refactor edilebilir.
interface CategoryInfo {
  id: number; // veya string, API'nize göre
  name: string;
  slug: string;
}
interface ApiProjectData {
  id: string | number; // API'den gelen ID string veya number olabilir
  title: string;
  slug: string;
  type: string;
  description?: string | null;
  coverImagePublicId?: string | null;
  bannerImagePublicId?: string | null;
  releaseDate?: string | Date | null; // Ekledik
  categories: { category: CategoryInfo }[];
  viewCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  averageRating?: number;
}

async function fetchTypedProjectsFromApi(projectType: 'oyun' | 'anime'): Promise<ApiProjectData[]> {
  try {
    // API endpoint'ine 'type' parametresini ekliyoruz
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

const DubbedAnimeSection = () => {
  const [projects, setProjects] = useState<ApiProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchTypedProjectsFromApi('anime'); // 'anime' tipini belirt
        setProjects(data);
      } catch (err: any) {
        setError(err.message || "Anime projeleri yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center text-dublio-text-dark">Animeler yükleniyor...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">Hata: {error}</div>;
  }

  // Veriyi ShowcaseSection'ın beklediği formata dönüştür
  const showcaseItems: ShowcaseCardData[] = projects.map(p => ({
    slug: p.slug,
    title: p.title,
    categories: p.categories.map(pc => pc.category),
    coverImageUrl: p.coverImagePublicId || '/images/placeholder-cover.jpg',
    bannerImageUrl: p.bannerImagePublicId || '/images/placeholder-banner.jpg',
    description: p.description || undefined,
    // releaseDate: p.releaseDate, // SliderCard'a tarih gerekirse eklenebilir
  }));

  if (showcaseItems.length === 0 && !isLoading) {
     return <div className="container mx-auto py-8 text-center text-dublio-text-dark">Gösterilecek anime projesi bulunamadı.</div>;
  }

  return (
    <ShowcaseSection
      sectionTitle="Dublajlanan Animeler"
      totalCount={showcaseItems.length}
      totalCountLabel="Toplam Dublajlanan Anime Sayısı"
      items={showcaseItems}
      itemTypePath="animeler" // URL yolu için
      swiperInstanceName="dubbed-anime-swiper" // Benzersiz Swiper class adı
      dubRequestLink="/istek/anime-dublaj" // Farklı istek linki (isteğe bağlı)
    />
  );
};

export default DubbedAnimeSection;