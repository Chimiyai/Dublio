// src/components/home/DubbedGamesSection.tsx
"use client";
import ShowcaseSection from './ShowcaseSection';
import { dubbedGamesDataSample } from '@/data/showcaseData'; // Sahte veriyi import edin

const DubbedGamesSection = () => {
  return (
    <ShowcaseSection
      sectionTitle="Dublajlanan Oyunlar"
      totalCount={dubbedGamesDataSample.length} // Dinamik olarak say
      totalCountLabel="Toplam Dublajlanan Oyun Sayısı"
      items={dubbedGamesDataSample}
      itemTypePath="oyunlar"
      swiperInstanceName="dubbed-games-swiper" // Benzersiz class adı
    />
  );
};

export default DubbedGamesSection;