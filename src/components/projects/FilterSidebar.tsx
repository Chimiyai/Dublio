// src/components/projects/FilterSidebar.tsx
'use client';

import { Category } from '@prisma/client';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategorySlugs: string[]; // Artık ID değil slug alıyoruz
  onCategoryChange: (categorySlugs: string[]) => void; // Tüm seçili slugları array olarak döner
  currentSearchTerm: string;
  onSearchTermChange: (term: string) => void;
  currentProjectType: 'oyun' | 'anime' | '';
  onProjectTypeChange: (type: 'oyun' | 'anime' | '') => void;
}

export default function FilterSidebar({
  categories,
  selectedCategorySlugs,
  onCategoryChange,
  currentSearchTerm,
  onSearchTermChange,
  currentProjectType,
  onProjectTypeChange,
}: FilterSidebarProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState(currentSearchTerm);
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    setInternalSearchTerm(currentSearchTerm);
  }, [currentSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalSearchTerm !== currentSearchTerm) {
        onSearchTermChange(internalSearchTerm);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [internalSearchTerm, onSearchTermChange, currentSearchTerm]);

  const handleCategorySelection = (slug: string) => {
  const newSelectedSlugs = selectedCategorySlugs.includes(slug)
    ? selectedCategorySlugs.filter(s => s !== slug)
    : [...selectedCategorySlugs, slug];
  console.log("FilterSidebar: Kategori Değişikliği:", newSelectedSlugs); // KONSOL LOG 1
  onCategoryChange(newSelectedSlugs);
};

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const projectTypes = [
    { label: 'Tümü', value: '' as const },
    { label: 'Oyunlar', value: 'oyun' as const },
    { label: 'Animeler', value: 'anime' as const },
  ];

  return (
    <aside className="bg-prestij-sidebar-bg p-5 rounded-lg shadow-lg space-y-6">
      {/* Proje Tipi Filtresi */}
      <div>
        <label className="block text-lg font-semibold text-prestij-text-primary mb-3">
          Proje Tipi
        </label>
        <div className="space-y-2">
          {projectTypes.map((typeOpt) => (
            <button
              key={typeOpt.value}
              onClick={() => onProjectTypeChange(typeOpt.value)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                ${currentProjectType === typeOpt.value
                  ? 'bg-prestij-500 text-white font-semibold'
                  : 'bg-prestij-input-bg text-prestij-text-secondary hover:bg-prestij-input-bg/70'
                }
              `}
            >
              {typeOpt.label}
            </button>
          ))}
        </div>
      </div>
      <hr className="border-prestij-border-dark" />

      {/* Arama */}
      <div>
        <label htmlFor="projectSearchSidebar" className="block text-lg font-semibold text-prestij-text-primary mb-2">
          Proje Ara
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-prestij-text-muted" />
          </div>
          <input
            id="projectSearchSidebar"
            type="search"
            placeholder="Proje adı..."
            value={internalSearchTerm}
            onChange={(e) => setInternalSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-prestij-input-bg rounded-md text-sm text-prestij-text-primary placeholder-prestij-text-placeholder focus:outline-none focus:ring-1 focus:ring-prestij-500 border border-transparent focus:border-prestij-500"
          />
        </div>
      </div>
      <hr className="border-prestij-border-dark" />

      {/* Kategoriler */}
      <div>
        <label htmlFor="categorySearchSidebar" className="block text-lg font-semibold text-prestij-text-primary mb-1">
          Kategoriler
        </label>
        <div className="relative mt-2 mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-prestij-text-muted" />
          </div>
          <input
            id="categorySearchSidebar"
            type="search"
            placeholder="Kategori ara..."
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-prestij-input-bg rounded-md text-xs sm:text-sm text-prestij-text-primary placeholder-prestij-text-placeholder focus:outline-none focus:ring-1 focus:ring-prestij-500 border border-transparent focus:border-prestij-500"
          />
        </div>
        <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-prestij-border-dark scrollbar-track-prestij-input-bg pr-2">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-md hover:bg-prestij-input-bg/60 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCategorySlugs.includes(category.slug)} // slug kullanıyoruz
                  onChange={() => handleCategorySelection(category.slug)} // slug gönderiyoruz
                  className="form-checkbox h-4 w-4 text-prestij-500 bg-transparent border-prestij-border-dark rounded focus:ring-prestij-500 focus:ring-2 focus:ring-offset-0 focus:ring-offset-prestij-sidebar-bg transition-colors"
                />
                <span className="text-sm text-prestij-text-secondary group-hover:text-prestij-text-primary">{category.name}</span>
              </label>
            ))
          ) : (
            <p className="text-xs text-prestij-text-muted px-2 py-1">
              {categorySearch ? `"${categorySearch}" ile eşleşen kategori bulunamadı.` : "Kategori yok."}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}