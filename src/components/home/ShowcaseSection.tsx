// src/components/home/ShowcaseSection.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import SliderCard from '@/components/ui/SliderCard'; // Bir önceki adımda oluşturduğumuz kart

// Swiper React component'lerini ve stillerini import ediyoruz
import { Swiper, SwiperSlide } from 'swiper/react';
import { Grid, Autoplay, FreeMode } from 'swiper/modules'; // Kullanacağımız modüller

// Swiper stilleri (Temel ve kullanacağımız modüller için)
import 'swiper/css';
import 'swiper/css/grid'; // Grid modülü için CSS
import 'swiper/css/autoplay'; // Autoplay için (isteğe bağlı)
import 'swiper/css/free-mode'; // FreeMode için (isteğe bağlı)
// Eğer pagination veya navigation isterseniz onların da CSS'lerini import etmeniz gerekir:
// import 'swiper/css/pagination';
// import 'swiper/css/navigation';

interface CardDataItem {
  slug: string;
  title: string;
  type: 'Oyun' | 'Anime';
  coverImageUrl: string;
  bannerImageUrl: string;
  description?: string;
}

interface ShowcaseSectionProps {
  sectionTitle: string;
  totalCount: number;
  totalCountLabel: string; // Örn: "Toplam Dublajlanan Oyun Sayısı"
  items: CardDataItem[];
  itemTypePath: 'oyunlar' | 'animeler'; // Linkler için /oyunlar/ veya /animeler/
  dubRequestLink?: string; // "Dublaj İsteği Gönder" linki (opsiyonel)
  swiperInstanceName: string; // Her Swiper için benzersiz bir class adı, örn: 'dubbed-games-swiper'
}

const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({
  sectionTitle,
  totalCount,
  totalCountLabel,
  items,
  itemTypePath,
  dubRequestLink = "#", // Varsayılan link
  swiperInstanceName,
}) => {
  return (
    <section className={`showcase-section py-5 lg:py-10`}> {/* Orijinal: padding: 20px 0 40px 0; */}
      <div className="container mx-auto">
        <div className="section-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
          <h2 className="section-title text-2xl lg:text-3xl font-semibold text-prestij-text-primary mb-2 sm:mb-0">
            {sectionTitle}
          </h2>
          <div className="section-meta flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto">
            <span className="meta-info text-sm text-slider-meta-info-text">
              {totalCountLabel}: <span className="font-medium text-prestij-text-secondary">{totalCount}</span>
            </span>
            <Link
              href={dubRequestLink}
              className="btn btn-action btn-dub-request bg-slider-btn-dub-request-bg text-prestij-text-secondary border border-slider-btn-dub-request-border 
                         text-xs font-medium py-2 px-3.5 rounded-md hover:bg-prestij-purple hover:border-prestij-purple hover:text-white transition-colors"
            >
              Dublaj İsteği Gönder
            </Link>
          </div>
        </div>
      </div>

      {/* Swiper Container - Container dışına taşabilir (tam genişlik hissi için) veya içinde kalabilir */}
      {/* Orijinal CSS'de .swiper-container container dışındaydı ve padding'i yoktu */}
      <div className={`swiper-container ${swiperInstanceName} w-full overflow-hidden pb-10`}> {/* Altta pagination için boşluk (gerekirse) */}
        <Swiper
          modules={[Grid, Autoplay, FreeMode]} // Kullandığımız modüller
          loop={items.length > 15} // Çok fazla kart varsa loop (performans için)
          grabCursor={true}
          freeMode={{ // Orijinal script.js'deki gibi sürekli akış için
            enabled: true,
            sticky: false,
            momentumRatio: 0.3,
            momentumVelocityRatio: 0.3,
          }}
          autoplay={{ // Yavaş ve sürekli kayma
            delay: 1, // Çok kısa gecikme
            disableOnInteraction: false, // Etkileşimden sonra durmasın
            pauseOnMouseEnter: true,    // Üzerine gelince dursun
          }}
          speed={10000} // Kayma hızı (ms) - ne kadar yüksekse o kadar yavaş
          
          slidesPerView={'auto'} // Kartların kendi genişliğine göre ayarlanır
          slidesPerGroup={1}   // Sürekli akış için 1
          
          grid={{ // İki satırlı grid (orijinal script.js'deki gibi)
            rows: 2,
            fill: 'row',
          }}
          spaceBetween={15} // Kartlar arası boşluk

          // Responsive Breakpoint'ler (Orijinal script.js'deki gibi)
          // Swiper v6+ `grid.rows` ile `slidesPerView`'ın breakpoint'lerde nasıl çalışacağına dikkat edin.
          // Bazen `grid.rows` breakpoint içinde de ayarlanmalı veya `slidesPerView` ona göre hesaplanmalı.
          // En basit haliyle, `slidesPerView` kart sayısını, `grid.rows` ise satır sayısını belirler.
          // Örnek: 1024px'de 4 kart yan yana, 2 satır = toplam 8 kart görünür.
          breakpoints={{
            320: { slidesPerView: 1.5, grid: { rows: 1 }, spaceBetween: 10 },
            480: { slidesPerView: 2.2, grid: { rows: 1 }, spaceBetween: 10 },
            768: { slidesPerView: 3, grid: { rows: 2, fill: 'row' }, spaceBetween: 12 },
            1024: { slidesPerView: 4, grid: { rows: 2, fill: 'row' }, spaceBetween: 15 },
            1280: { slidesPerView: 5, grid: { rows: 2, fill: 'row' }, spaceBetween: 15 },
            1600: { slidesPerView: 6, grid: { rows: 2, fill: 'row' }, spaceBetween: 15 },
          }}
          className="!overflow-visible" // Tailwind'in overflow-hidden'ını ezmek için (kart gölgeleri vs. için)
                                        // veya swiper wrapper'ına padding verilebilir.
        >
          {items.map((item) => (
            <SwiperSlide key={item.slug} className="!h-auto flex"> {/* Yükseklik auto ve flex, SliderCard'ın tam oturması için */}
              <SliderCard
                slug={item.slug}
                title={item.title}
                type={item.type}
                coverImageUrl={item.coverImageUrl}
                bannerImageUrl={item.bannerImageUrl}
                description={item.description}
                itemTypePath={itemTypePath}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ShowcaseSection;