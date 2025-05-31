// src/components/games/GamesPageClient.tsx
'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react'; // React importu
import { Category } from '@prisma/client'; // Project tipine gerek yoksa kaldırılabilir
import FilterSidebar from './FilterSidebar';
import ProjectGrid from './ProjectGrid';
import SortDropdown from './SortDropdown';
import Pagination from '../ui/Pagination';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { Project } from '@prisma/client'; // Project tipini ProjectCardData için alalım

// API'den dönen proje tipi
export interface ProjectCardData extends Pick<Project, 
  'id' | 'title' | 'slug' | 'type' | 'coverImagePublicId' | 
  'releaseDate' | 'likeCount' | 'dislikeCount' | 'favoriteCount'
> {
  bannerImagePublicId?: string | null;
  description?: string | null;
  _count?: { comments?: number | null } | null;
}

interface ApiResponse {
  projects: ProjectCardData[];
  totalPages: number;
  currentPage: number;
  totalResults: number;
}

interface GamesPageClientProps {
  initialCategories: Category[];
}

export type SortByType = 'releaseDate' | 'createdAt' | 'title' | 'likeCount' | 'favoriteCount';
export type SortOrderType = 'asc' | 'desc';

export default function GamesPageClient({ initialCategories }: GamesPageClientProps): React.ReactNode { // Dönüş tipi eklendi
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams(); // Hook'u bir değişkene ata
  const [isPending, startTransition] = useTransition();

  const getInitialStateFromUrl = useCallback(<T,>(paramName: string, defaultValue: T, parser: (val: string) => T = (val) => val as T): T => {
    const value = searchParamsHook.get(paramName); // searchParamsHook kullan
    return value ? parser(value) : defaultValue;
  }, [searchParamsHook]); // searchParamsHook'u bağımlılığa ekle

  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [currentPage, setCurrentPage] = useState(() => getInitialStateFromUrl('page', 1, Number));
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState(() => getInitialStateFromUrl('q', ''));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(() => 
    getInitialStateFromUrl('categories', [], (val) => val.split(',').map(Number).filter(id => !isNaN(id)))
  );
  const [sortBy, setSortBy] = useState<SortByType>(() => getInitialStateFromUrl('sortBy', 'releaseDate' as SortByType));
  const [sortOrder, setSortOrder] = useState<SortOrderType>(() => getInitialStateFromUrl('sortOrder', 'desc' as SortOrderType));

  const limitPerPage = 20;

  useEffect(() => {
    const fetchDataAndUpdateUrl = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', limitPerPage.toString());
      if (searchTerm) params.set('q', searchTerm);
      if (selectedCategoryIds.length > 0) params.set('categories', selectedCategoryIds.join(','));
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);

      const newUrl = `${pathname}?${params.toString()}`;
      
      // Mevcut URL ile aynıysa router.replace yapma (gereksiz re-render önler)
      if (typeof window !== 'undefined' && window.location.search !== `?${params.toString()}`) {
        startTransition(() => {
          router.replace(newUrl, { scroll: false });
        });
      }

      try {
        console.log("GamesPageClient: API İsteği Gönderiliyor:", `/api/oyunlar?${params.toString()}`);
        const response = await fetch(`/api/oyunlar?${params.toString()}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: 'Oyunlar yüklenemedi (yanıt okunamadı).' }));
          throw new Error(errData.message || 'Oyunlar yüklenemedi.');
        }
        const data: ApiResponse = await response.json();
        console.log("GamesPageClient: API'den Gelen Yanıt:", data);
        setProjects(data.projects);
        setTotalPages(data.totalPages);
        setTotalResults(data.totalResults);
        // setCurrentPage(data.currentPage); // BU SATIRI KALDIRDIK - URL'den senkronize olacak
      } catch (error) {
        console.error("Fetch projects error:", error);
        setProjects([]);
        toast.error((error as Error).message || "Oyunlar yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndUpdateUrl();
  }, [currentPage, searchTerm, selectedCategoryIds, sortBy, sortOrder, pathname, router, startTransition, limitPerPage]);

  useEffect(() => {
    const urlPage = Number(searchParamsHook.get('page')) || 1; // searchParamsHook kullan
    const urlSearchTerm = searchParamsHook.get('q') || '';
    const urlCategories = searchParamsHook.get('categories')?.split(',').map(Number).filter(id => !isNaN(id)) || [];
    const urlSortBy = (searchParamsHook.get('sortBy') as SortByType) || 'releaseDate';
    const urlSortOrder = (searchParamsHook.get('sortOrder') as SortOrderType) || 'desc';

    // State'leri sadece URL'deki değerlerle farklıysa güncelle
    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlSearchTerm !== searchTerm) setSearchTerm(urlSearchTerm);
    if (JSON.stringify(urlCategories.sort()) !== JSON.stringify(selectedCategoryIds.sort())) setSelectedCategoryIds(urlCategories);
    if (urlSortBy !== sortBy) setSortBy(urlSortBy);
    if (urlSortOrder !== sortOrder) setSortOrder(urlSortOrder);

  }, [searchParamsHook, currentPage, searchTerm, selectedCategoryIds, sortBy, sortOrder]); // State'leri de bağımlılığa ekledik, sadece farklıysa set edecekler

  const handlePageChange = (newPage: number) => { setCurrentPage(newPage); };
  const handleSearchChange = (newSearchTerm: string) => { setSearchTerm(newSearchTerm); setCurrentPage(1); };
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryIds(prev => {
      const newSelected = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      setCurrentPage(1);
      return newSelected;
    });
  };
  const handleSortChange = (newSortBy: SortByType, newSortOrder: SortOrderType) => {
    setSortBy(newSortBy); setSortOrder(newSortOrder); setCurrentPage(1);
  };

  return ( // FONKSİYONUN ANA RETURN İFADESİ BURADA BAŞLIYOR
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sol Sidebar */}
      <div className="w-full lg:w-1/4 xl:w-1/5">
        <FilterSidebar
          categories={initialCategories}
          selectedCategories={selectedCategoryIds}
          onCategoryChange={handleCategoryChange}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Sağ İçerik Alanı */}
      <div className="w-full lg:w-3/4 xl:w-4/5">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <p className="text-sm text-prestij-text-secondary mb-2 sm:mb-0">
            Toplam <span className="font-semibold text-prestij-text-primary">{totalResults}</span> sonuç bulundu
          </p>
          <SortDropdown 
            sortBy={sortBy} 
            sortOrder={sortOrder} 
            onSortChange={handleSortChange} 
          />
        </div>

        <ProjectGrid projects={projects} isLoading={isLoading} type="oyun" />

        {totalPages > 1 && !isLoading && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  ); // FONKSİYONUN ANA RETURN İFADESİ BURADA BİTİYOR
} // GamesPageClient FONKSİYONUNUN KAPANIŞI