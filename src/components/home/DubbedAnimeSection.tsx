// src/components/home/DubbedAnimeSection.tsx
"use client";
import ShowcaseSection from './ShowcaseSection';
import { dubbedAnimeDataSample } from '@/data/showcaseData'; // Sahte veriyi import edin

const DubbedAnimeSection = () => {
  return (
    <ShowcaseSection
      sectionTitle="Dublajlanan Animeler"
      totalCount={dubbedAnimeDataSample.length} // Dinamik olarak say
      totalCountLabel="Toplam Dublajlanan Anime Sayısı"
      items={dubbedAnimeDataSample}
      itemTypePath="animeler"
      swiperInstanceName="dubbed-anime-swiper" // Benzersiz class adı
    />
  );
};

export default DubbedAnimeSection;