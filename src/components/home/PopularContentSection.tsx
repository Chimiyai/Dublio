// src/components/home/PopularContentSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PopularContentCard from '@/components/ui/PopularContentCard';
import DropdownControl from '@/components/ui/DropdownControl';
import { CategoryInfo as GlobalCategoryInfo, ApiProjectPopular } from '@/types/showcase';

// Dropdown seçenekleri (sabit)
const azSortItems = [
  { label: "A-Z'ye Göre Sırala", value: 'titleAsc' },
  { label: "Z-A'ya Göre Sırala", value: 'titleDesc' },
];
const categoryItemsOyun: GlobalCategoryInfo[] = [
  { id: 'all-games', name: "Tümü", slug: 'all' }, { id: 'rpg', name: "RPG", slug: 'rpg' },
  // ...
];
const categoryItemsAnime: GlobalCategoryInfo[] = [
  { id: 'all-animes', name: "Tümü", slug: 'all' }, { id: 'macera', name: "Macera", slug: 'macera' },
  // ...
];
const sortItems = [
  { label: "Popülerliğe Göre", value: 'popular' },
  { label: "Eklenme Tarihine Göre (Yeni)", value: 'newest' },
  { label: "Eklenme Tarihine Göre (Eski)", value: 'oldest' },
  { label: "Beğeni Sayısına Göre", value: 'likes' },
];

const formatDateForCard = (dateString?: string | Date | null): string => {
  if (!dateString) return "Bilinmiyor";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Geçersiz Tarih";
    return `${date.getDate()} ${date.toLocaleString('tr-TR', { month: 'short' })} ${date.getFullYear()}`;
  } catch {
    return "Geçersiz Tarih";
  }
};

const PopularContentSection = () => {
  const [activeContentType, setActiveContentType] = useState<'Oyun' | 'Anime'>('Oyun');
  const [displayedItems, setDisplayedItems] = useState<ApiProjectPopular[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentAZSort, setCurrentAZSort] = useState<string | null>(null);
  const [currentCategorySlug, setCurrentCategorySlug] = useState<string>('all');
  const [currentSortBy, setCurrentSortBy] = useState<string>('popular');

  const fetchPopularContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let apiUrl = '/api/projects?';
    const params = new URLSearchParams();

    if (activeContentType === 'Oyun') params.append('type', 'oyun');
    else if (activeContentType === 'Anime') params.append('type', 'anime');

    if (currentCategorySlug !== 'all') params.append('category', currentCategorySlug);
    
    if (currentAZSort) {
      params.append('sortBy', currentAZSort);
    } else {
      params.append('sortBy', currentSortBy);
    }
    
    apiUrl += params.toString();
    // console.log("Fetching popular content from:", apiUrl);

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "API'den hata mesajı alınamadı." }));
        throw new Error(`API Hatası (${res.status}): ${errorData.message || res.statusText}`);
      }
      const data: ApiProjectPopular[] = await res.json();
      setDisplayedItems(data);
    } catch (err: any) {
      console.error("Popular content fetch error:", err);
      setError(err.message || "İçerikler yüklenirken bir hata oluştu.");
      setDisplayedItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeContentType, currentAZSort, currentCategorySlug, currentSortBy]);

  useEffect(() => {
    fetchPopularContent();
  }, [fetchPopularContent]);

  const handleContentTypeChange = (type: 'Oyun' | 'Anime') => {
    setActiveContentType(type);
    setCurrentCategorySlug('all');
    setCurrentAZSort(null);
  };
  
  const currentCategoryItems = activeContentType === 'Oyun' ? categoryItemsOyun : categoryItemsAnime;

  return (
    <section className="popular-content-section py-10 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="popular-content-header flex flex-col md:flex-row justify-between items-center mb-8 md:mb-10">
          <div className="popular-section-title-group flex flex-col md:flex-row items-center gap-3 md:gap-5 mb-6 md:mb-0 w-full md:w-auto">
            <h2 className="section-title popular-title text-xl sm:text-2xl lg:text-3xl font-bold text-gray-100 whitespace-nowrap order-1 md:order-2">
              Herkesin Beğendiği İçerikler
            </h2>
            <div className="flex gap-3 order-2 md:order-1">
              <button
                onClick={() => handleContentTypeChange('Oyun')}
                className={`btn filter-btn text-sm sm:text-base py-1.5 px-4 sm:px-5 rounded-full border transition-colors
                            ${activeContentType === 'Oyun' 
                              ? 'bg-prestij-purple text-white border-prestij-purple'
                              : 'bg-transparent text-gray-400 border-gray-700 hover:bg-gray-700/50 hover:text-gray-200 hover:border-gray-600'}`}
              >
                Oyun
              </button>
            </div>
            <div className="order-3 md:order-3">
               <button
                onClick={() => handleContentTypeChange('Anime')}
                className={`btn filter-btn text-sm sm:text-base py-1.5 px-4 sm:px-5 rounded-full border transition-colors
                            ${activeContentType === 'Anime' 
                              ? 'bg-prestij-purple text-white border-prestij-purple'
                              : 'bg-transparent text-gray-400 border-gray-700 hover:bg-gray-700/50 hover:text-gray-200 hover:border-gray-600'}`}
              >
                Anime
              </button>
            </div>
          </div>

          <div className="content-controls-wrapper flex flex-wrap justify-center md:justify-end items-center gap-2 sm:gap-3 mt-4 md:mt-0 w-full md:w-auto">
            <DropdownControl
              buttonId="azSortToggle"
              buttonLabel={currentAZSort === 'titleAsc' ? "A-Z" : currentAZSort === 'titleDesc' ? "Z-A" : "A-Z Sırala"}
              buttonIcon={<i className="fas fa-sort-alpha-down text-xs opacity-70"></i>}
              items={azSortItems}
              onItemSelected={(value) => { setCurrentAZSort(value); }}
              menuId="azSortMenu"
            />
            <DropdownControl
              buttonId="categoryToggle"
              buttonLabel={currentCategoryItems.find(c => c.slug === currentCategorySlug)?.name || "Kategoriler"}
              buttonIcon={<i className="fas fa-chevron-down text-xs opacity-70"></i>}
              items={currentCategoryItems.map(c => ({label: c.name, value: c.slug}))}
              onItemSelected={setCurrentCategorySlug}
              menuId="categoryMenu"
            />
            <DropdownControl
              buttonId="sortToggle"
              buttonLabel={sortItems.find(s => s.value === currentSortBy)?.label || "Sırala"}
              buttonIcon={<i className="fas fa-chevron-down text-xs opacity-70"></i>}
              items={sortItems}
              onItemSelected={(value) => { setCurrentSortBy(value); setCurrentAZSort(null); }}
              menuId="sortMenu"
            />
          </div>
        </div>

        {isLoading && <p className="text-center text-prestij-text-dark py-10">İçerikler yükleniyor...</p>}
        {!isLoading && error && <p className="text-center text-red-500 py-10">Hata: {error}</p>}
        {!isLoading && !error && displayedItems.length > 0 && (
          <div className="popular-games-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mx-auto px-4">
            {displayedItems.map((item) => (
              console.log("PopularContentSection - item.type from API:", item.type, "item.title:", item.title),
              <PopularContentCard
                key={item.id.toString()}
                slug={item.slug}
                title={item.title}
                type={item.type as 'Oyun' | 'Anime'}
                bannerImageUrl={item.bannerImagePublicId}
                coverImageUrl={item.coverImagePublicId}
                description={item.description || "Açıklama bulunmuyor."}
                date={formatDateForCard(item.createdAt || item.releaseDate)}
                likes={item.likeCount ?? 0}
                dislikes={item.dislikeCount ?? 0}
                favorites={item.favoriteCount ?? 0}
                itemTypePath={item.type === 'oyun' ? 'oyunlar' : 'animeler'}
              />
            ))}
          </div>
        )}
        {!isLoading && !error && displayedItems.length === 0 && (
          <p className="text-center text-prestij-text-muted py-10">Bu kriterlere uygun içerik bulunamadı.</p>
        )}
      </div>
    </section>
  );
};

export default PopularContentSection;