// src/components/home/HeroSection.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopProjectCard from './TopProjectCard';
import MainShowcase from './MainShowcase';
import SideShowcaseItem from './SideShowcaseItem';

// Sahte Veriler (Lütfen kendi verilerinizi ve doğru 'image' yollarını kullanın)
const topProjectsData = [
  { id: 'tp1', type: 'Oyun', title: 'PROJE ÜST 1', date: 'GG/AA/YYYY', bannerUrl: '/images/banner-placeholder-1.jpg', coverUrl: '/images/cover-placeholder-1.jpg', slug: 'proje-ust-1' },
  { id: 'tp2', type: 'Anime', title: 'PROJE ÜST 2', date: 'GG/AA/YYYY', bannerUrl: '/images/banner-placeholder-2.jpg', coverUrl: '/images/cover-placeholder-2.jpg', slug: 'proje-ust-2' },
  { id: 'tp3', type: 'Oyun', title: 'PROJE ÜST 3', date: 'GG/AA/YYYY', bannerUrl: '/images/banner-placeholder-3.jpg', coverUrl: '/images/cover-placeholder-3.jpg', slug: 'proje-ust-3' },
];

const sideListData = [
  { index: 0, title: "Oyun A: Yeni Ufuklar", description: "Geniş bir dünyada geçen macera oyunu.", image: "/images/banner-placeholder-1.jpg", banner: "/images/side-banner-1.jpg", cover: "/images/cover-placeholder-1.jpg", type: "Oyun", detailsUrl: "#", cardTitle: "KART A" },
  { index: 1, title: "Anime B: Yıldız Tozu", description: "Duygusal bir bilim kurgu animesi.", image: "/images/banner-placeholder-2.jpg", banner: "/images/side-banner-2.jpg", cover: "/images/cover-placeholder-2.jpg", type: "Anime", detailsUrl: "#", cardTitle: "KART B" },
  { index: 2, title: "Oyun C: Son Direniş", description: "Aksiyon dolu bir hayatta kalma mücadelesi.", image: "/images/banner-placeholder-3.jpg", banner: "/images/side-banner-3.jpg", cover: "/images/cover-placeholder-3.jpg", type: "Oyun", detailsUrl: "#", cardTitle: "KART C" },
  { index: 3, title: "Anime D: Kayıp Melodi", description: "Müzik ve gizem dolu bir hikaye.", image: "/images/main-hero-placeholder.jpg", banner: "/images/side-banner-1.jpg", cover: "/images/main-cover-placeholder.jpg", type: "Anime", detailsUrl: "#", cardTitle: "KART D" },
];

const AUTO_SLIDE_DELAY = 5000; 

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentCardData = sideListData[currentIndex];

  const changeShowcaseItem = useCallback((newIndex: number) => {
    if (newIndex === currentIndex || newIndex < 0 || newIndex >= sideListData.length) {
        if (autoSlideTimerRef.current) clearTimeout(autoSlideTimerRef.current);
        if (sideListData.length > 1) {
            autoSlideTimerRef.current = setTimeout(() => {
                const nextAutoIndex = (newIndex + 1) % sideListData.length;
                changeShowcaseItem(nextAutoIndex);
            }, AUTO_SLIDE_DELAY);
        }
        return;
    }
    setCurrentIndex(newIndex);
  }, [currentIndex, sideListData.length]);


  useEffect(() => {
    if (sideListData.length <= 1) return;
    if (autoSlideTimerRef.current) clearTimeout(autoSlideTimerRef.current);
    
    autoSlideTimerRef.current = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % sideListData.length;
      changeShowcaseItem(nextIndex);
    }, AUTO_SLIDE_DELAY);

    return () => {
      if (autoSlideTimerRef.current) clearTimeout(autoSlideTimerRef.current);
    };
  }, [currentIndex, changeShowcaseItem, sideListData.length]);

  const handleSideItemClick = (index: number) => {
    changeShowcaseItem(index);
  };

  if (!currentCardData) { // Veri yüklenirken veya boşsa bir fallback
    return <div className="container mx-auto min-h-[500px] flex justify-center items-center"><p>Yükleniyor...</p></div>;
  }

  return (
    <section className="hero-section bg-hero-bg py-8 mb-12 overflow-hidden">
      <div className="container mx-auto">
        <div className="top-projects-row flex flex-col md:flex-row justify-between gap-5 mb-8">
          {topProjectsData.map((project) => ( <TopProjectCard key={project.id} type={project.type as 'Oyun' | 'Anime'} title={project.title} date={project.date} bannerUrl={project.bannerUrl} coverUrl={project.coverUrl} slug={project.slug}/>))}
        </div>
        <div className="main-hero-content flex flex-col lg:flex-row gap-5 items-stretch relative 
     min-h-[300px] // Mobil için daha küçük minimum yükseklik
     sm:min-h-[400px] 
     md:min-h-[380px] 
     lg:min-h-[480px] 
     xl:min-h-[500px]
     w-full // Tam genişlik
">
          <div className="relative flex-grow lg:min-w-0">
            <MainShowcase
              key={`${currentCardData.index}-${currentCardData.title}`} 
              category={currentCardData.type as 'Oyun' | 'Anime' | 'Öne Çıkan'}
              title={currentCardData.title}
              description={currentCardData.description}
              imageUrl={currentCardData.image}
              coverUrl={currentCardData.cover}
              detailsUrl={currentCardData.detailsUrl}
            />
          </div>
          <aside className="hero-side-list w-full lg:w-[280px] lg:flex-shrink-0 flex flex-col gap-2.5">
            {sideListData.map((item, index) => (
              <SideShowcaseItem
                key={item.index}
                cardTitle={item.cardTitle}
                type={item.type as 'Oyun' | 'Anime'}
                coverUrl={item.cover}
                bannerUrl={item.banner}
                isActive={index === currentIndex}
                onClick={() => handleSideItemClick(index)}
              />
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;