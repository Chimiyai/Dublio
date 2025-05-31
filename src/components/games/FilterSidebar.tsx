// src/components/games/FilterSidebar.tsx
'use client';

import { Category } from '@prisma/client';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'; // Arama ikonu için

interface FilterSidebarProps {
  // initialCategories prop olarak geliyordu, direkt categories olarak alalım
  categories: Category[];
  selectedCategories: number[];
  onCategoryChange: (categoryId: number) => void;
  
  // Oyun adı arama için
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function FilterSidebar({
  categories,
  selectedCategories,
  onCategoryChange,
  searchTerm,
  onSearchChange,
}: FilterSidebarProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Prop'tan gelen searchTerm değiştiğinde internalSearchTerm'i güncelle (URL'den senkronizasyon için)
  useEffect(() => {
    setInternalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Debounce için bir timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalSearchTerm !== searchTerm) { // Sadece gerçekten değiştiyse ana state'i güncelle
        onSearchChange(internalSearchTerm);
      }
    }, 500); // 500ms debounce süresi

    return () => clearTimeout(timer);
  }, [internalSearchTerm, onSearchChange, searchTerm]);


  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  return (
    <aside className="bg-prestij-sidebar-bg p-5 rounded-lg shadow-lg space-y-6 sticky top-20 self-start"> {/* self-start eklendi */}
      {/* Oyun Adı Arama */}
      <div>
        <label htmlFor="gameSearchInputSidebar" className="block text-lg font-semibold text-prestij-text-primary mb-2">
          Oyun Ara
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-prestij-text-muted" aria-hidden="true" />
          </div>
          <input
            id="gameSearchInputSidebar"
            type="search" // type="search" daha uygun
            placeholder="Oyun adı..."
            value={internalSearchTerm}
            onChange={(e) => setInternalSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-prestij-input-bg rounded-md text-sm text-prestij-text-primary placeholder-prestij-text-placeholder focus:outline-none focus:ring-1 focus:ring-prestij-500 border border-transparent focus:border-prestij-500"
          />
        </div>
      </div>
      
      <hr className="border-prestij-border-dark" />

      {/* Oyun Türleri Filtreleme */}
      <div>
        <label htmlFor="categorySearchInputSidebar" className="block text-lg font-semibold text-prestij-text-primary mb-1">
          Oyun Türleri
        </label>
        <div className="relative mt-2 mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-prestij-text-muted" aria-hidden="true" />
            </div>
            <input
            id="categorySearchInputSidebar"
            type="search"
            placeholder="Tür ara..."
            value={categorySearchTerm}
            onChange={(e) => setCategorySearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-prestij-input-bg rounded-md text-xs sm:text-sm text-prestij-text-primary placeholder-prestij-text-placeholder focus:outline-none focus:ring-1 focus:ring-prestij-500 border border-transparent focus:border-prestij-500"
            />
        </div>
        
        <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-prestij-border-dark scrollbar-track-prestij-input-bg pr-2">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2.5 cursor-pointer p-2 rounded-md hover:bg-prestij-input-bg/60 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => onCategoryChange(category.id)}
                  className="form-checkbox h-4 w-4 text-prestij-500 bg-transparent border-prestij-border-dark rounded focus:ring-prestij-500 focus:ring-2 focus:ring-offset-0 focus:ring-offset-prestij-sidebar-bg transition-colors"
                />
                <span className="text-sm text-prestij-text-secondary group-hover:text-prestij-text-primary">{category.name}</span>
              </label>
            ))
          ) : (
            <p className="text-xs text-prestij-text-muted px-2 py-1">
              {categorySearchTerm ? `"${categorySearchTerm}" ile eşleşen tür bulunamadı.` : "Yüklenecek kategori bulunamadı."}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}