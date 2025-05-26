// src/components/home/ShowcaseSection.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { ShowcaseCardData } from '@/types/showcase';
import SliderCard from '@/components/ui/SliderCard'; // Güncellenecek kart

import { Swiper, SwiperSlide } from 'swiper/react';
import { Grid, Autoplay, FreeMode } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/autoplay';
import 'swiper/css/free-mode';

interface ShowcaseSectionProps {
  sectionTitle: string;
  totalCount: number;
  totalCountLabel: string;
  items: ShowcaseCardData[];
  itemTypePath: 'oyunlar' | 'animeler' | string;
  dubRequestLink?: string;
  swiperInstanceName: string; // örn: dubbed-games-swiper
}

const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({
  sectionTitle,
  totalCount,
  totalCountLabel,
  items,
  itemTypePath,
  dubRequestLink = "#",
  swiperInstanceName,
}) => {
  // Eğer hiç item yoksa ve yükleme de bitmişse, bölümü hiç gösterme veya mesaj göster
  if (items.length === 0) {
    return (
      <section className={`showcase-section py-[20px] md:pb-[40px] bg-prestij-bg-dark-section`}>
        <div className="container mx-auto">
          <div className="section-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 px-4 sm:px-0">
            <h2 className="section-title text-[1.6em] sm:text-[1.8em] font-semibold text-prestij-text-primary mb-2 sm:mb-0">
              {sectionTitle}
            </h2>
            {/* Meta bilgisi ve istek butonu gösterilmeyebilir */}
          </div>
          <p className="text-center text-prestij-text-dark py-8">Bu bölümde gösterilecek içerik bulunmuyor.</p>
        </div>
      </section>
    );
  }

  return (
    // Orijinal CSS: .showcase-section { padding: 20px 0 40px 0; }
    <section className={`showcase-section py-[20px] md:pb-[40px] bg-prestij-bg-dark-section `}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 md:pt-10"> {/* Container padding'leri */}
        {/* Orijinal CSS: .showcase-section .section-header */}
        <div className="section-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[30px]">
          <h2 className="section-title text-[1.6em] sm:text-[1.8em] font-semibold text-gray-200"> {/* text-E0E0E0 */}
            {sectionTitle}
          </h2>
          {/* Orijinal CSS: .showcase-section .section-meta */}
          <div className="section-meta flex items-center gap-3 sm:gap-5 mt-2 sm:mt-0">
            {/* Orijinal CSS: .showcase-section .meta-info */}
            <span className="meta-info text-xs sm:text-sm text-gray-400"> {/* text-A0A0B0 */}
              {totalCountLabel}: <span className="font-medium text-gray-300">{totalCount}</span>
            </span>
            {/* Orijinal CSS: .showcase-section .btn-dub-request */}
            <Link
              href={dubRequestLink}
              className="btn-dub-request text-[0.75em] sm:text-[0.85em] font-medium py-[6px] px-3 sm:py-2 sm:px-[18px]
                         bg-[#231B36] text-[#D1D1D1] border border-[#28282C] rounded-md
                         transition-colors duration-200 ease-in-out
                         hover:bg-prestij-purple hover:border-prestij-purple hover:text-white"
            >
              Dublaj İsteği Gönder
            </Link>
          </div>
        </div>
      </div>

      {/* Swiper Container - Tam genişlik için container dışına alıyoruz */}
      {/* Orijinal CSS: padding: 10px 0 40px 0; overflow: hidden; */}
      <div className={`swiper-container ${swiperInstanceName} w-full pt-[10px] pb-[20px] md:pb-[40px] overflow-hidden`}>
      {/* Swiper'ın kendisine padding-left/right vermek yerine, slide'lara padding vereceğiz. */}
      {/* VEYA container'ı Swiper'ın dışına çıkarıp, Swiper'ı max-w-screen-xl gibi bir class ile sarmalayabiliriz. */}
      {/* Şimdilik w-full ve slide'lara padding ile devam edelim. */}
        <Swiper
          modules={[Grid, Autoplay, FreeMode]}
          loop={items.length >= 16} // Daha fazla kart olunca loop (2 satır * 8 kart gibi)
          grabCursor={true}
          freeMode={{
            enabled: true,
            sticky: false,
            momentumRatio: 0.3,
            momentumVelocityRatio: 0.3,
          }}
          autoplay={{
            delay: 1,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={swiperInstanceName.includes('anime') ? 11000 : 10000} // Anime için biraz farklı hız
          
          slidesPerView={'auto'} // Bu, .swiper-slide'ın CSS'deki width'ine göre çalışır
          slidesPerGroup={1}
          
          grid={{
            rows: 2,
            fill: 'row',
          }}
          // Orijinal CSS: .swiper-slide { padding: 5px; }
          // spaceBetween slide'lar arası boşluğu ayarlar, kartın kendi iç padding'i için SliderCard'a bakacağız.
          // Eğer slide'ın kendisine bir "çerçeve" padding'i vermek istiyorsak, o zaman spaceBetween yerine bunu kullanırız.
          // Şimdilik spaceBetween kalsın, kartlar arası boşluk için.
          spaceBetween={15} 

          breakpoints={{ // Bu breakpoint'ler .swiper-slide'ın width'ini etkilemez eğer slidesPerView: 'auto' ise.
                         // 'auto' yerine sayısal değerler verirsek etkiler.
                         // 'auto' ile CSS'teki .swiper-slide { width: ... } tanımı önemli olur.
            320: { slidesPerView: 1.5, grid: { rows: 1 }, spaceBetween: 10 },
            480: { slidesPerView: 2.2, grid: { rows: 1 }, spaceBetween: 10 },
            // Orijinal CSS'de .swiper-slide width: 270px gibi bir şey vardı.
            // Responsive tasarımda bunu 'auto' ile yönetmek daha iyi.
            // Ancak 'auto' için Swiper'ın her slide'ın genişliğini hesaplaması gerekir.
            // Eğer her kartın sabit bir genişliği olacaksa (örn: 270px), o zaman slidesPerView: 'auto' yerine
            // breakpoint'lerde sayısal değerler kullanmak (örn: 768: { slidesPerView: 3 }) daha iyi olabilir.
            // Şimdilik 'auto' ve grid ile devam edelim, gerekirse SliderCard'a width vereceğiz.
            768: { slidesPerView: 3, grid: { rows: 2, fill: 'row' }, spaceBetween: 12 },
            1024: { slidesPerView: 4, grid: { rows: 2, fill: 'row' }, spaceBetween: 15 },
            1280: { slidesPerView: 5, grid: { rows: 2, fill: 'row' }, spaceBetween: 15 },
            1600: { slidesPerView: 6, grid: { rows: 2, fill: 'row' }, spaceBetween: 15 },
          }}
          // className="!overflow-visible" // Bu genellikle gölgelerin kesilmemesi için.
          // Eğer .swiper-container'a overflow:hidden verdiysek, slide'lara padding eklemek daha iyi.
          // Ya da Swiper wrapper'ının (bu div) dışına bir container daha ekleyip ona overflow:hidden verilebilir.
        >
          {items.map((item) => (
            // Orijinal CSS: .swiper-slide { padding: 5px; }
            // Bu padding'i SliderCard'ın dış linkine (slider-card-link) verebiliriz.
            <SwiperSlide key={item.slug} className="!h-auto flex self-stretch p-[5px]"> {/* self-stretch ve p-[5px] eklendi */}
              <SliderCard
                slug={item.slug}
                title={item.title}
                categories={item.categories}
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