// src/components/animes/AnimesPageClient.tsx
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Category, Project } from '@prisma/client';
import FilterSidebar from '../games/FilterSidebar';     // AYNI FilterSidebar'ı kullanabiliriz
import ProjectGrid from '../games/ProjectGrid';         // AYNI ProjectGrid'i kullanabiliriz
import SortDropdown from '../games/SortDropdown';       // AYNI SortDropdown'u kullanabiliriz
import Pagination from '../ui/Pagination';              // AYNI Pagination'ı kullanabiliriz
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

// ProjectCardData tipi (GamesPageClient ile aynı olabilir, merkezi bir dosyaya taşınabilir)
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

interface AnimesPageClientProps { // Props adı değişti
  initialCategories: Category[];
}

export type SortByType = 'releaseDate' | 'createdAt' | 'title' | 'likeCount' | 'favoriteCount';
export type SortOrderType = 'asc' | 'desc';


export default function AnimesPageClient({ initialCategories }: AnimesPageClientProps) { // Fonksiyon adı değişti
  const router = useRouter();
  const pathname = usePathname(); // Bu /animeler olacak
  const searchParamsHook = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ... (getInitialStateFromUrl ve tüm state tanımları GamesPageClient ile AYNI) ...
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
      // ... (params oluşturma AYNI) ...
      params.set('page', currentPage.toString());
      params.set('limit', limitPerPage.toString());
      if (searchTerm) params.set('q', searchTerm);
      if (selectedCategoryIds.length > 0) params.set('categories', selectedCategoryIds.join(','));
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);

      const newUrl = `${pathname}?${params.toString()}`;
      if (typeof window !== 'undefined' && window.location.search !== `?${params.toString()}`) {
        startTransition(() => { router.replace(newUrl, { scroll: false }); });
      }

      try {
        console.log("AnimesPageClient: API İsteği Gönderiliyor:", `/api/animeler?${params.toString()}`);
        const response = await fetch(`/api/animeler?${params.toString()}`); // <<== API URL'İ DEĞİŞTİ
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: 'Oyunlar yüklenemedi (yanıt okunamadı).' }));
          throw new Error(errData.message || 'Oyunlar yüklenemedi.');
        }
        const data: ApiResponse = await response.json();
        setProjects(data.projects);
        setTotalPages(data.totalPages);
        setTotalResults(data.totalResults);
      } catch (error) {
        console.error("Fetch projects error:", error);
        setProjects([]);
        toast.error((error as Error).message || "Oyunlar yüklenirken bir hata oluştu.");
      }
      finally { setIsLoading(false); }
    };
    fetchDataAndUpdateUrl();
  }, [currentPage, searchTerm, selectedCategoryIds, sortBy, sortOrder, pathname, router, startTransition, limitPerPage]);

  // ... (URL senkronizasyon useEffect'i AYNI) ...
  useEffect(() => { /* ... */ }, [searchParamsHook, currentPage, searchTerm, selectedCategoryIds, sortBy, sortOrder]);

  // ... (Tüm handle... fonksiyonları AYNI) ...
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

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-1/4 xl:w-1/5">
        <FilterSidebar
          categories={initialCategories}
          selectedCategories={selectedCategoryIds}
          onCategoryChange={handleCategoryChange}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          // Sidebar başlığını "Anime Türleri" vs. yapmak için prop eklenebilir
        />
      </div>
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
        <ProjectGrid projects={projects} isLoading={isLoading} type="anime" /> {/* type="anime" olarak değişti */}
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
  );
}