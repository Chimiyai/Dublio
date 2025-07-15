// src/components/home/HeroSection.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopProjectCard from './TopProjectCard'; // TopProjectCardProps buradan geliyor
import MainShowcase from './MainShowcase';
import SideShowcaseItem from './SideShowcaseItem';
import { formatDate } from '@/lib/utils'; // formatDate fonksiyonunu import et
// Placeholder Component'lerini import et
import TopProjectCardPlaceholder from './TopProjectCardPlaceholder';
import MainShowcasePlaceholder from './MainShowcasePlaceholder';
import SideShowcaseItemPlaceholder from './SideShowcaseItemPlaceholder';

const AUTO_SLIDE_DELAY = 5000;

interface ApiBaseProject {
  id: string | number;
  slug: string;
  title: string;
  type: string;
  bannerImagePublicId?: string | null;
  coverImagePublicId?: string | null;
  releaseDate?: string | Date | null; // Bu alan zaten vardı
  description?: string | null;
}

async function fetchTopFavoriteProjects(): Promise<ApiBaseProject[]> {
  try {
    const res = await fetch('/api/projects/top-favorites');
    if (!res.ok) { console.error("Top favoriler yüklenemedi"); return []; }
    return await res.json();
  } catch (e) { console.error("API Error fetchTopFavoriteProjects:", e); return []; }
}

async function fetchLatestProjectsForSideList(): Promise<ApiBaseProject[]> {
  try {
    const res = await fetch('/api/projects?limit=4&orderBy=createdAt');
    if (!res.ok) { console.error("Yan liste projeleri yüklenemedi"); return []; }
    return await res.json();
  } catch (e) { console.error("API Error fetchLatestProjectsForSideList:", e); return []; }
}

const HeroSection = () => {
  const [topProjects, setTopProjects] = useState<ApiBaseProject[]>([]);
  const [sideListApiData, setSideListApiData] = useState<ApiBaseProject[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [topData, sideData] = await Promise.all([
        fetchTopFavoriteProjects(),
        fetchLatestProjectsForSideList()
      ]);
      setTopProjects(topData);
      setSideListApiData(sideData);
      // console.log("HeroSection: sideListApiData loaded:", sideData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const sideListData = sideListApiData.map((p, index) => ({
    index: index,
    id: p.id.toString(),
    title: p.title,
    description: p.description || "Bu proje için açıklama yakında eklenecektir.",
    image: p.bannerImagePublicId,
    banner: p.bannerImagePublicId,
    cover: p.coverImagePublicId,
    type: p.type.toLowerCase() === 'oyun' ? 'Oyun' : p.type.toLowerCase() === 'anime' ? 'Anime' : p.type,
    detailsUrl: `/${p.type.toLowerCase() === 'oyun' ? 'oyunlar' : 'animeler'}/${p.slug}`,
    cardTitle: p.title,
    slug: p.slug,
    releaseDate: p.releaseDate, // << Tarih bilgisini buraya ekliyoruz/teyit ediyoruz
  }));

  // sideListData.forEach((item, idx) => console.log(`HeroSection: sideListData[${idx}]:`, {id: item.id, title: item.title, releaseDate: item.releaseDate }));

  const currentCardData = sideListData.length > 0 ? sideListData[currentIndex] : null;
  // console.log("HeroSection: currentCardData updated.", { id: currentCardData?.id, currentIndex: currentIndex, title: currentCardData?.title, releaseDate: currentCardData?.releaseDate });


  const changeShowcaseItem = useCallback((newIndex: number) => {
    // console.log("HeroSection: changeShowcaseItem called with newIndex:", newIndex, "Current currentIndex:", currentIndex);
    if (newIndex < 0 || newIndex >= sideListData.length) return;
    if (newIndex === currentIndex && sideListData.length > 1) {
        if (autoSlideTimerRef.current) clearTimeout(autoSlideTimerRef.current);
        autoSlideTimerRef.current = setTimeout(() => {
            const nextAutoIndex = (newIndex + 1) % sideListData.length;
            changeShowcaseItem(nextAutoIndex);
        }, AUTO_SLIDE_DELAY);
        return;
    }
    setCurrentIndex(newIndex);
  }, [currentIndex, sideListData.length]);

  useEffect(() => {
    if (sideListData.length <= 1) {
        if (autoSlideTimerRef.current) clearTimeout(autoSlideTimerRef.current);
        return;
    }
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
    // console.log("HeroSection: handleSideItemClick called with index:", index);
    changeShowcaseItem(index);
  };

  if (isLoading) {
    return (
      <section className="hero-section bg-dublio-bg-dark-3 py-8 mb-12 overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Üstteki 3 Favori Kart Placeholder */}
          <div className="top-projects-row flex flex-col md:flex-row justify-center md:justify-between gap-5 mb-8">
            {[...Array(3)].map((_, i) => (
              <TopProjectCardPlaceholder key={`top-ph-${i}`} />
            ))}
          </div>

          {/* Ana Hero İçeriği Placeholder */}
          <div className="main-hero-content flex flex-col lg:flex-row gap-5 items-stretch relative w-full">
            <div className="relative flex-grow lg:min-w-0 lg:w-[calc(100%-300px)] xl:w-[calc(100%-320px)] min-h-[450px] lg:min-h-[500px]">
              <MainShowcasePlaceholder />
            </div>
            <aside className="hero-side-list w-full lg:w-[280px] xl:w-[300px] lg:flex-shrink-0 flex flex-col gap-2.5 lg:h-auto lg:flex-grow">
              {[...Array(4)].map((_, i) => ( // Genellikle 4-5 tane yan liste öğesi olur
                <SideShowcaseItemPlaceholder key={`side-ph-${i}`} />
              ))}
            </aside>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-section bg-dublio-bg-dark-3 py-8 overflow-hidden">
      <div className="container mx-auto px-4">
      {topProjects.length > 0 && (
          <div className="top-projects-row flex flex-col md:flex-row justify-center md:justify-between gap-5 mb-8">
          {topProjects.map((project) => {
            const projectType = project.type.toLowerCase() === 'oyun' ? 'Oyun' : project.type.toLowerCase() === 'anime' ? 'Anime' : project.type;
            return (
              <TopProjectCard
                  key={project.id.toString()}
                  type={projectType as 'Oyun' | 'Anime'}
                  title={project.title}
                  description={project.description}
                  date={project.releaseDate} // TopProjectCard'a da Date objesi veya string olarak geçebiliriz
                  bannerUrl={project.bannerImagePublicId}
                  coverUrl={project.coverImagePublicId}
                  slug={project.slug}
              />
            );
          })}
          </div>
      )}
      {!isLoading && topProjects.length === 0 && sideListData.length === 0 && (
        <div className="min-h-[100px] flex justify-center items-center mb-8">
            <p className="text-dublio-text-dark">Şu anda öne çıkan proje bulunmuyor.</p>
        </div>
      )}

        {currentCardData ? (
            (() => {
                // console.log(`%cHeroSection RENDERING MainShowcase with showcaseKey: ${currentCardData.id.toString()}`, "color: purple; font-weight: bold;");
                return (
                    <div className="hero-section-container flex flex-col lg:flex-row gap-3">
                      <div className="hero-main flex-grow">
                        <MainShowcase
                            showcaseKey={currentCardData.id.toString()}
                            category={currentCardData.type}
                            title={currentCardData.title}
                            description={currentCardData.description || ""}
                            imageUrl={currentCardData.image}
                            coverUrl={currentCardData.cover}
                            detailsUrl={currentCardData.detailsUrl || '#'}
                            releaseDate={currentCardData.releaseDate} // << Tarihi MainShowcase'e prop olarak geçiyoruz
                        />
                      </div>
                      
                      <div className="hero-side-list flex flex-col gap-2 lg:w-[300px]">
                        {sideListData.map((item, index) => (
                            <SideShowcaseItem
                                key={item.id}
                                cardTitle={item.cardTitle || item.title}
                                type={item.type}
                                coverUrl={item.cover}
                                bannerUrl={item.banner}
                                isActive={index === currentIndex}
                                onClick={() => handleSideItemClick(index)}
                                // SideShowcaseItem'a tarih eklemek isterseniz item.releaseDate'i de prop olarak geçebilirsiniz.
                            />
                        ))}
                      </div>
                    </div>
                );
            })()
        ) : (
            !isLoading && <div className="min-h-[400px] flex justify-center items-center"><p className="text-dublio-text-dark">Gösterilecek ana içerik bulunamadı.</p></div>
        )}
      </div>
    </section>
  );
};
export default HeroSection;