// src/components/projects/ProjectsPageClient.tsx
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Category, Project as PrismaProjectType } from '@prisma/client'; // Prisma'dan Project tipini al
import toast from 'react-hot-toast';

import FilterSidebar from './FilterSidebar';         // YENİ YOL
import ProjectGrid from './ProjectGrid';             // YENİ YOL
import SortDropdown, { SortOptionItem } from './SortDropdown';
import Pagination from '@/components/ui/Pagination'; // Doğru yolu kontrol et
import { Prisma } from '@prisma/client';

const sortOptionsList: SortOptionItem[] = [
    { value: 'releaseDate-desc', label: 'Yayın Tarihi (Yeni)', group: 'Tarihe Göre' },
    { value: 'releaseDate-asc', label: 'Yayın Tarihi (Eski)', group: 'Tarihe Göre' },
    { value: 'title-asc', label: 'Alfabetik (A-Z)', group: 'Alfabetik' },
    { value: 'title-desc', label: 'Alfabetik (Z-A)', group: 'Alfabetik' },
    { value: 'likeCount-desc', label: 'Beğeni (Çoktan Aza)', group: 'Popülerlik' },
    { value: 'favoriteCount-desc', label: 'Favori (Çoktan Aza)', group: 'Popülerlik' },
    { value: 'averageRating-desc', label: 'Puan (Yüksekten Düşüğe)', group: 'Popülerlik'},
    { value: 'viewCount-desc', label: 'Görüntülenme (Çoktan Aza)', group: 'Popülerlik'}, // Label güncellendi
    { value: 'createdAt-desc', label: 'Eklenme Tarihi (Yeni)', group: 'Tarihe Göre' },
];

const projectCardSelect = Prisma.validator<Prisma.ProjectSelect>()({
  id: true,
  slug: true,
  title: true,
  type: true,
  coverImagePublicId: true,
  bannerImagePublicId: true,
  description: true,
  releaseDate: true,
  likeCount: true,
  dislikeCount: true,
  favoriteCount: true,
  averageRating: true,
  price: true,
  currency: true,
});

export type ProjectForCard = Prisma.ProjectGetPayload<{
  select: typeof projectCardSelect
}>;

interface ApiResponse {
  projects: ProjectForCard[];
  totalPages: number;
  currentPage: number;
  totalResults: number;
}

interface ProjectsPageClientProps {
  initialCategories: Category[];
}

export type SortByType = 'releaseDate' | 'createdAt' | 'title' | 'likeCount' | 'favoriteCount' | 'averageRating' | 'viewCount';
export type SortOrderType = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

export default function ProjectsPageClient({ initialCategories }: ProjectsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname(); // Bu '/projeler' olacak
  const searchParams = useSearchParams(); // Hook'u doğrudan kullan
  const [isFetching, startFetchingTransition] = useTransition();

  // State'ler
  const [projects, setProjects] = useState<ProjectForCard[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // URL'den initial değerleri okumak için yardımcı fonksiyon
  const getInitialParam = <T,>(paramName: string, defaultValue: T, parser: (val: string) => T = (val) => val as T): T => {
    const value = searchParams.get(paramName);
    return value ? parser(value) : defaultValue;
  };

  // Filtre ve sıralama state'leri
  const [currentPage, setCurrentPage] = useState(() => getInitialParam('page', 1, Number));
  const [currentSort, setCurrentSort] = useState(() => getInitialParam('sort', 'releaseDate-desc'));
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>(() => getInitialParam('categories', [] as string[], val => val.split(',')));
  const [searchTerm, setSearchTerm] = useState(() => getInitialParam('q', ''));
  const [projectType, setProjectType] = useState<'oyun' | 'anime' | ''>(() => getInitialParam('type', '' as 'oyun' | 'anime' | ''));


  // Veri çekme fonksiyonu
  const fetchProjects = useCallback(() => {
    startFetchingTransition(async () => {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());

      if (currentSort) {
        const [sortBy, sortOrder] = currentSort.split('-');
        if (sortBy) params.set('sortBy', sortBy);
        if (sortOrder) params.set('sortOrder', sortOrder);
      }
      if (selectedCategorySlugs.length > 0) {
      params.set('categories', selectedCategorySlugs.join(','));
    }
      if (searchTerm.trim()) {
        params.set('q', searchTerm.trim());
      }
      if (projectType) {
        params.set('type', projectType);
      }

      try {
        const apiUrl = `/api/projeler?${params.toString()}`;
        console.log("ProjectsPageClient: API İsteği URL:", apiUrl);
        const res = await fetch(apiUrl);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ message: 'Projeler yüklenirken bir hata oluştu.' }));
          throw new Error(errData.message || 'Projeler yüklenemedi.');
        }
        const data: ApiResponse = await res.json();
        console.log("ProjectsPageClient VERİSİ:", data.projects);
        setProjects(data.projects || []);
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.totalResults || 0);
      } catch (error) {
        console.error("Projeler çekilirken hata:", error);
        toast.error((error as Error).message || "Projeler yüklenirken bir hata oluştu.");
        setProjects([]);
        setTotalPages(1);
        setTotalResults(0);
      }
    });
  }, [currentPage, currentSort, selectedCategorySlugs, searchTerm, projectType, startFetchingTransition]);

  // URL'i state değişikliklerine göre güncelleme ve ilk yükleme
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('sort', currentSort);

    if (selectedCategorySlugs.length > 0) params.set('categories', selectedCategorySlugs.join(','));
    else params.delete('categories');

    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    else params.delete('q');

    if (projectType) params.set('type', projectType);
    else params.delete('type');

    // Tarayıcı geçmişini çok fazla kirletmemek için replace kullanıyoruz
    // ve sadece parametreler gerçekten değiştiyse push yapıyoruz.
    const currentQueryString = searchParams.toString();
    const newQueryString = params.toString();

    if (currentQueryString !== newQueryString) {
        router.replace(`${pathname}?${newQueryString}`, { scroll: false });
    }
    // İlk yüklemede ve bağımlılıklar değiştiğinde veri çek
    fetchProjects();

  }, [currentPage, currentSort, selectedCategorySlugs, searchTerm, projectType, pathname, router, fetchProjects, searchParams]);


  // Event Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChangeCallback = (newSortValue: string) => {
    setCurrentSort(newSortValue);
    setCurrentPage(1);
  };
  
  // FilterSidebar'dan gelen kategori ID'leri yerine slug'ları kullanacağız
  // API'miz kategori slug'larına göre filtreleme yapacak şekilde güncellenmeli
  // veya FilterSidebar'dan ID'ler geliyorsa, API'miz ID'leri kabul etmeli.
  // Şimdilik FilterSidebar'dan slug'ların geldiğini varsayalım.
  const handleCategoryChange = (categorySlugs: string[]) => {
  console.log("ProjectsPageClient: Seçilen Kategori Slug'ları (state öncesi):", categorySlugs); // KONSOL LOG 2
  setSelectedCategorySlugs(categorySlugs);
  setCurrentPage(1);
};

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
  };

  const handleProjectTypeChange = (type: 'oyun' | 'anime' | '') => {
    setProjectType(type);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-x-8 gap-y-6">
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-24 self-start"> {/* Sticky sidebar */}
        <FilterSidebar
          categories={initialCategories} // Category[] tipinde
          selectedCategorySlugs={selectedCategorySlugs} // string[] tipinde sluglar
          onCategoryChange={handleCategoryChange} // (slugs: string[]) => void
          currentSearchTerm={searchTerm} // İsmi değiştirdim
          onSearchTermChange={handleSearchChange} // İsmi değiştirdim
          currentProjectType={projectType} // İsmi değiştirdim
          onProjectTypeChange={handleProjectTypeChange} // İsmi değiştirdim
        />
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <p className="text-sm text-dublio-text-muted">
            {isFetching ? 'Projeler yükleniyor...' : (totalResults > 0 ? `${totalResults} proje bulundu.` : 'Aramanızla eşleşen proje bulunamadı.')}
          </p>
          <SortDropdown
            value={currentSort}
            onChange={handleSortChangeCallback}
            options={sortOptionsList} // Tanımladığımız listeyi prop olarak geçiyoruz
          />
        </div>

        <ProjectGrid projects={projects} isLoading={isFetching} />

        {!isFetching && totalPages > 1 && (
          <div className="mt-10">
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