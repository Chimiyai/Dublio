// src/components/home/DubbedAnimesSection.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Grid, Autoplay, FreeMode } from 'swiper/modules'; // Gerekli modülleri import et
import 'swiper/css';
import 'swiper/css/grid';
// import 'swiper/css/pagination'; // Eğer pagination kullanacaksan

import type { SliderCardData } from '@/app/page'; // page.tsx'ten tipi al
import { PlayIcon } from '@heroicons/react/24/solid'; // Örnek ikon

interface DubbedSectionProps {
  title: string;
  totalCount: number;
  items: SliderCardData[];
  swiperClassName: string; // dubled-animes-swiper veya dubbed-anime-swiper
  dubRequestLink?: string; // Opsiyonel dublaj isteği linki
}

export default function DubbedAnimesSection({ title, totalCount, items, swiperClassName, dubRequestLink = "#" }: DubbedSectionProps) {
  if (!items || items.length === 0) {
    return (
      <section className="showcase-section py-10 md:py-12">
        <div className="container mx-auto">
          <div className="section-header flex flex-col sm:flex-row justify-between items-center mb-8">
            <h2 className="section-title text-2xl md:text-3xl font-semibold text-gray-100">{title}</h2>
            <p className="text-gray-400">Henüz içerik bulunmuyor.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="showcase-section py-10 md:py-12">
      <div className="container mx-auto">
        <div className="section-header flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
          <h2 className="section-title text-2xl md:text-3xl font-semibold text-gray-100">{title}</h2>
          <div className="section-meta flex items-center gap-5 mt-2 sm:mt-0">
            <span className="meta-info text-sm text-gray-400">
              Toplam Dublajlanan {title.includes("Oyun") ? "Oyun" : "Anime"} Sayısı: <span className="font-semibold text-gray-200">{totalCount}</span>
            </span>
            <Link
              href={dubRequestLink}
              className="btn btn-action btn-dub-request py-2 px-4 text-xs font-medium rounded-md
                         bg-secondary-dark border border-gray-700 text-gray-300
                         hover:bg-text-brand-purple hover:border-text-brand-purple hover:text-white transition-colors"
            >
              Dublaj İsteği Gönder
            </Link>
          </div>
        </div>
      </div>

      {/* Swiper container'ını tam genişlik yapmak için container dışına alabiliriz veya container'a max-w-none verebiliriz */}
      {/* Şimdilik container içinde bırakıyorum, padding'leri ayarlayacağız */}
      <div className={`swiper-container ${swiperClassName} !overflow-visible md:!overflow-hidden`}> {/* Swiper için !overflow-visible önemli olabilir */}
        <Swiper
          modules={[Grid, Autoplay, FreeMode]}
          loop={items.length >= 10} // Yeterli slide varsa loop
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
          speed={10000} // Hız
          slidesPerView={'auto'} // CSS'teki .swiper-slide genişliğine göre
          slidesPerGroup={1}
          grid={{
            rows: 2,
            fill: 'row',
          }}
          spaceBetween={15}
          breakpoints={{ // Senin CSS'indeki breakpoint'lere benzer
            320: { slidesPerView: 1.5, grid: { rows: 1 }, spaceBetween: 10 },
            480: { slidesPerView: 2.2, grid: { rows: 1 }, spaceBetween: 10 },
            768: { slidesPerView: 3, grid: { rows: 2 }, spaceBetween: 12 },
            1024: { slidesPerView: 4, grid: { rows: 2 }, spaceBetween: 15 },
            1280: { slidesPerView: 5, grid: { rows: 2 }, spaceBetween: 15 },
            1600: { slidesPerView: 6, grid: { rows: 2 }, spaceBetween: 15 }
          }}
          className="!pb-10" // Pagination için altta boşluk (eğer pagination eklersen)
        >
          {items.map((item) => (
            <SwiperSlide key={item.id} className="!h-auto flex"> {/* !h-auto önemli, !w-auto da gerekebilir */}
              <Link
                href={item.href}
                className="slider-card-link group block w-full h-full rounded-lg overflow-hidden relative transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="slider-card bg-[#100C1C] rounded-lg flex flex-col w-full h-full relative cursor-pointer overflow-hidden">
                  {/* Banner */}
                  <div
                    className="slider-card-banner w-full aspect-[16/7] bg-cover bg-center relative flex items-start p-2 transition-transform duration-300 ease-in-out group-hover:scale-103"
                    style={{ backgroundImage: `url(${item.banner})` }}
                  >
                    <div className="banner-top-to-bottom-fade absolute inset-0 bg-gradient-to-b from-[rgba(16,12,28,0.7)] via-50% via-[rgba(16,12,28,0.3)] to-transparent z-[2]"></div>
                    {/* Tür etiketi HTML'de banner üzerindeydi, istersen buraya ekleyebilirsin */}
                    {/* <span className={`project-type absolute top-2 left-2 text-xs ...`}>{item.type}</span> */}
                  </div>
                  {/* Banner Üzeri İçerik (Hover'da Görünecek) */}
                  <div className="slider-card-content-on-banner absolute bottom-0 left-0 w-full p-2.5 flex items-end gap-2 z-[3] opacity-0 translate-y-2.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250 ease-out delay-100">
                    <Image src={item.cover} alt={`${item.title} Kapak`} width={40} height={56} className="slider-card-cover rounded border border-white/10 shadow-sm shrink-0 object-cover opacity-0 scale-85 -translate-x-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all duration-250 ease-out delay-150" />
                    <div className="slider-card-info flex-grow min-w-0 text-gray-100 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250 ease-out delay-200">
                      <h3 className="slider-card-title text-sm font-semibold text-white mb-0.5 leading-tight whitespace-nowrap overflow-hidden text-ellipsis ">{item.title}</h3>
                      <p className="slider-card-description text-[0.7rem] leading-snug text-gray-300 overflow-hidden line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                  {/* Hover Overlay (Play ikonu için) */}
                  <div className="slider-card-hover-overlay absolute inset-0 bg-bg-primary-dark/60 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-[4] pointer-events-none">
                    <PlayIcon className="h-10 w-10 text-white/80" />
                  </div>
                  {/* Karartma Efekti (Hover'da) */}
                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-[2] pointer-events-none rounded-b-lg"></div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}