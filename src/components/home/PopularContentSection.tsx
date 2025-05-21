// src/components/home/PopularContentSection.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { PopularContentCardData } from '@/app/page';
import {
  ChevronDownIcon,
  ArrowDownIcon, // Eskiden ArrowDownAZIcon idi
  ArrowUpIcon,   // Eskiden ArrowUpAZIcon idi
  AdjustmentsHorizontalIcon, // Eskiden ListFilterIcon idi
  HandThumbUpIcon, // Eskiden ThumbsUpIcon idi
  HandThumbDownIcon, // Eskiden ThumbsDownIcon idi
  HeartIcon // Bu zaten doğru olmalı
} from '@heroicons/react/24/outline'; // veya /24/solid
interface PopularContentSectionProps {
  initialFilter: 'oyun' | 'anime';
  allItems: PopularContentCardData[];
}

export default function PopularContentSection({ initialFilter, allItems }: PopularContentSectionProps) {
  const [activeFilterType, setActiveFilterType] = useState<'oyun' | 'anime'>(initialFilter);
  const [filteredItems, setFilteredItems] = useState<PopularContentCardData[]>([]);
  const [currentSortBy, setCurrentSortBy] = useState('popular'); // 'popular', 'newest', 'likes'
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentTextSort, setCurrentTextSort] = useState<'a-z' | 'z-a' | null>(null);

  // Dropdown'ların açık/kapalı durumları için state'ler
  const [isAzSortOpen, setIsAzSortOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortByOpen, setIsSortByOpen] = useState(false);
  
  // TODO: Dışarı tıklama ile dropdown'ları kapatma (Navbar'daki gibi bir useEffect)


  useEffect(() => {
    let tempItems = allItems.filter(item => item.type.toLowerCase() === activeFilterType);

    if (currentCategory !== 'all') {
      tempItems = tempItems.filter(item => item.category.toLowerCase() === currentCategory);
    }

    if (currentTextSort === 'a-z') {
      tempItems.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentTextSort === 'z-a') {
      tempItems.sort((a, b) => b.title.localeCompare(a.title));
    } else if (currentSortBy === 'newest') {
        tempItems.sort((a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime());
    } else if (currentSortBy === 'likes') {
        tempItems.sort((a, b) => b.likes - a.likes);
    } else { // Varsayılan 'popular' veya başka bir mantık
        tempItems.sort((a,b) => (b.likes + b.favorites) - (a.likes + a.favorites));
    }

    setFilteredItems(tempItems);
  }, [allItems, activeFilterType, currentCategory, currentSortBy, currentTextSort]);

  const handleFilterTypeChange = (type: 'oyun' | 'anime') => {
    setActiveFilterType(type);
    setCurrentCategory('all'); // Tip değişince kategoriyi sıfırla
    setCurrentTextSort(null); // A-Z'yi sıfırla
    // Dropdown başlıklarını da sıfırlamak gerekebilir
    setIsCategoryOpen(false);
    setIsAzSortOpen(false);
  };

  // Kategori ve Sıralama Dropdown'ları için seçenekler
  const categories = ['all', 'action', 'adventure', 'rpg', 'strategy', 'comedy', 'slice-of-life']; // Örnek
  const sortOptions = [
    { value: 'popular', label: 'Popülerliğe Göre' },
    { value: 'newest', label: 'Eklenme Tarihine Göre' },
    { value: 'likes', label: 'Beğeni Sayısına Göre' },
  ];
  const textSortOptions = [
    { value: 'a-z', label: 'A-Z\'ye Göre Sırala' },
    { value: 'z-a', label: 'Z-A\'ya Göre Sırala' },
  ];


  return (
    <section className="popular-content-section bg-[#08060D] py-12 md:py-16">
      <div className="container mx-auto">
        <div className="popular-content-header flex flex-col md:flex-row justify-between items-center mb-8 md:mb-10">
          <div className="popular-section-title-group flex items-center gap-4 sm:gap-5 mb-4 md:mb-0">
            <button
              onClick={() => handleFilterTypeChange('oyun')}
              className={`filter-btn px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-colors
                          ${activeFilterType === 'oyun' ? 'bg-text-brand-purple text-white border-text-brand-purple' : 'bg-transparent text-gray-400 border-gray-700 hover:border-text-brand-purple hover:text-text-brand-purple'}`}
            >
              Oyun
            </button>
            <h2 className="section-title popular-title text-xl sm:text-2xl md:text-3xl font-bold text-gray-100 whitespace-nowrap">
              Herkesin Beğendiği İçerikler
            </h2>
            <button
              onClick={() => handleFilterTypeChange('anime')}
              className={`filter-btn px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-colors
                          ${activeFilterType === 'anime' ? 'bg-text-brand-purple text-white border-text-brand-purple' : 'bg-transparent text-gray-400 border-gray-700 hover:border-text-brand-purple hover:text-text-brand-purple'}`}
            >
              Anime
            </button>
          </div>

          {/* Filtre ve Sıralama Kontrolleri */}
          <div className="content-controls-wrapper flex items-center gap-2 sm:gap-3">
            {/* A-Z Sıralama Dropdown */}
            <div className="dropdown-control relative">
              <button onClick={() => setIsAzSortOpen(!isAzSortOpen)} className="dropdown-control-toggle bg-[#130F1E] text-gray-300 border border-gray-700 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5 hover:border-text-brand-purple">
                {currentTextSort === 'a-z' ? 'A-Z' : currentTextSort === 'z-a' ? 'Z-A' : 'A-Z'} <ChevronDownIcon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isAzSortOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAzSortOpen && (
                <div className="dropdown-control-menu absolute top-full right-0 mt-1.5 w-48 bg-[#130F1E] border border-gray-700 rounded-md shadow-lg z-10 py-1">
                  {textSortOptions.map(opt => (
                    <a key={opt.value} href="#" onClick={(e) => { e.preventDefault(); setCurrentTextSort(opt.value as 'a-z' | 'z-a'); setCurrentSortBy('popular'); /* Diğer sıralamayı sıfırla */ setIsAzSortOpen(false);}} className="block px-3 py-1.5 text-xs sm:text-sm text-gray-300 hover:bg-text-brand-purple/20 hover:text-white">
                      {opt.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {/* Kategori Dropdown */}
            <div className="dropdown-control relative">
              <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="dropdown-control-toggle bg-[#130F1E] text-gray-300 border border-gray-700 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5 hover:border-text-brand-purple">
                {categories.find(c=>c === currentCategory)?.replace(/^./, str => str.toUpperCase()) || 'Kategoriler'} <ChevronDownIcon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryOpen && (
                 <div className="dropdown-control-menu absolute top-full right-0 mt-1.5 w-48 bg-[#130F1E] border border-gray-700 rounded-md shadow-lg z-10 py-1">
                  {categories.map(cat => (
                    <a key={cat} href="#" onClick={(e) => { e.preventDefault(); setCurrentCategory(cat); setCurrentTextSort(null); setIsCategoryOpen(false);}} className="block px-3 py-1.5 text-xs sm:text-sm text-gray-300 hover:bg-text-brand-purple/20 hover:text-white">
                      {cat === 'all' ? 'Tümü' : cat.replace(/^./, str => str.toUpperCase())}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {/* Sıralama Ölçütü Dropdown */}
            <div className="dropdown-control relative">
              <button onClick={() => setIsSortByOpen(!isSortByOpen)} className="dropdown-control-toggle bg-[#130F1E] text-gray-300 border border-gray-700 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5 hover:border-text-brand-purple">
                {sortOptions.find(s=>s.value === currentSortBy)?.label.split(' ')[0] || 'Sırala'} <ChevronDownIcon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isSortByOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSortByOpen && (
                <div className="dropdown-control-menu absolute top-full right-0 mt-1.5 w-52 bg-[#130F1E] border border-gray-700 rounded-md shadow-lg z-10 py-1">
                  {sortOptions.map(opt => (
                    <a key={opt.value} href="#" onClick={(e) => { e.preventDefault(); setCurrentSortBy(opt.value); setCurrentTextSort(null); setIsSortByOpen(false);}} className="block px-3 py-1.5 text-xs sm:text-sm text-gray-300 hover:bg-text-brand-purple/20 hover:text-white">
                      {opt.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="popular-games-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          {filteredItems.map((item) => (
            <Link
              href={item.url}
              key={item.id}
              className="popular-card-link group flex flex-col bg-[#130F1E] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02]"
            >
              <div className="popular-card-banner w-full aspect-[16/8] relative overflow-hidden">
                <Image src={item.banner} alt={`${item.title} Banner`} layout="fill" objectFit="cover" className="transition-transform duration-300 group-hover:scale-105" />
                {/* Tür etiketi HTML'de banner üzerindeydi, istersen buraya ekleyebilirsin */}
              </div>
              <div className="popular-card-content p-3 sm:p-4 flex gap-3 items-start">
                <Image src={item.cover} alt={`${item.title} Kapak`} width={60} height={60} className="popular-card-cover w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-md shrink-0 object-cover border border-white/10" />
                <div className="popular-card-info flex-grow min-w-0 text-gray-300">
                  <h3 className="popular-card-title text-base sm:text-lg font-semibold text-gray-100 mb-1 leading-tight line-clamp-2 group-hover:text-text-brand-purple">{item.title}</h3>
                  <p className="popular-card-description text-xs sm:text-sm leading-snug text-gray-400 mb-1.5 line-clamp-2">{item.description}</p>
                  <span className="popular-card-date text-[0.7rem] text-gray-500 block">{item.date}</span>
                </div>
              </div>
              <div className="popular-card-stats mt-auto p-2.5 sm:p-3 border-t border-gray-700/50 flex justify-around items-center">
                <button className="stat-button text-gray-400 hover:text-green-500 flex items-center gap-1 text-xs sm:text-sm"><HandThumbUpIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="stat-count font-medium">{item.likes > 999 ? (item.likes/1000).toFixed(1) + 'K' : item.likes}</span></button>
                <button className="stat-button text-gray-400 hover:text-red-500 flex items-center gap-1 text-xs sm:text-sm"><HandThumbDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="stat-count font-medium">{item.dislikes}</span></button>
                <button className="stat-button text-gray-400 hover:text-pink-500 flex items-center gap-1 text-xs sm:text-sm"><HeartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="stat-count font-medium">{item.favorites > 999 ? (item.favorites/1000).toFixed(1) + 'K' : item.favorites}</span></button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}