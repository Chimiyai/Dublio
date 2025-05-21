// src/components/home/HeroSection.tsx
'use client'; // Büyük ihtimalle client component olacak (sağ liste etkileşimi vb.)

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { PlayIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import type { TopProjectData, MainShowcaseData, SideListItemData } from '@/app/page'; // Tipleri ana sayfadan alıyoruz

interface HeroSectionProps {
  topProjects: TopProjectData[];
  initialMainShowcase: MainShowcaseData;
  sideListItems: SideListItemData[];
}

export default function HeroSection({ topProjects, initialMainShowcase, sideListItems }: HeroSectionProps) {
  const [mainShowcase, setMainShowcase] = useState<MainShowcaseData>(initialMainShowcase);
  const [activeSideItemIndex, setActiveSideItemIndex] = useState(0);
  const [isVisualFading, setIsVisualFading] = useState(false);
  const [isInfoFading, setIsInfoFading] = useState(false);
  const [isCoverVisible, setIsCoverVisible] = useState(true);

  const autoChangeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heroSideListRef = useRef<HTMLDivElement>(null); // Fare üzerine gelince durdurmak için
  const AUTO_CHANGE_DELAY = 7000; // Senin JS'dekiyle aynı yapabilirsin

  const updateMainShowcaseContent = (index: number) => {
    const selected = sideListItems[index];
    if (!selected) return;

    setIsVisualFading(true);
    setIsInfoFading(true);
    setIsCoverVisible(false);

    setTimeout(() => {
      setMainShowcase({
        category: selected.type,
        title: selected.title,
        description: selected.description,
        mainImageUrl: selected.image,
        coverImageUrl: selected.cover,
        playLink: '#play-link', // Gerçek linkler
        detailsLink: selected.detailsUrl,
      });
      setActiveSideItemIndex(index);
      setIsVisualFading(false);
      setIsInfoFading(false);
      setIsCoverVisible(true);
    }, 300); // CSS transition süresi
  };

  const startAutoChange = () => {
    if (autoChangeIntervalRef.current) clearInterval(autoChangeIntervalRef.current);
    if (sideListItems.length <= 1) return; // Tek eleman varsa veya yoksa başlatma

    autoChangeIntervalRef.current = setInterval(() => {
      setActiveSideItemIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % sideListItems.length;
        updateMainShowcaseContent(nextIndex);
        return nextIndex;
      });
    }, AUTO_CHANGE_DELAY);
  };

  useEffect(() => {
    if (sideListItems.length > 0) {
      updateMainShowcaseContent(0); // İlk elemanı yükle
      startAutoChange();
    }
    return () => {
      if (autoChangeIntervalRef.current) clearInterval(autoChangeIntervalRef.current);
    };
  }, [sideListItems]); // Sadece sideListItems değiştiğinde çalışsın

  const handleSideItemClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    updateMainShowcaseContent(index);
    startAutoChange(); // Tıklamadan sonra sayacı sıfırla
  };
  
  // Fare ile üzerine gelince durdurma/başlatma
    useEffect(() => {
        const sideListElement = heroSideListRef.current;
        const mainShowcaseLinkElement = document.getElementById('mainShowcaseLink'); // Eğer varsa

        const handleMouseEnter = () => autoChangeIntervalRef.current && clearInterval(autoChangeIntervalRef.current);
        const handleMouseLeave = startAutoChange;

        if (sideListElement) {
            sideListElement.addEventListener('mouseenter', handleMouseEnter);
            sideListElement.addEventListener('mouseleave', handleMouseLeave);
        }
        if (mainShowcaseLinkElement) {
            mainShowcaseLinkElement.addEventListener('mouseenter', handleMouseEnter);
            mainShowcaseLinkElement.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (sideListElement) {
                sideListElement.removeEventListener('mouseenter', handleMouseEnter);
                sideListElement.removeEventListener('mouseleave', handleMouseLeave);
            }
            if (mainShowcaseLinkElement) {
                mainShowcaseLinkElement.removeEventListener('mouseenter', handleMouseEnter);
                mainShowcaseLinkElement.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, [sideListItems]); // sideListItems değiştiğinde (veya startAutoChange referansı değiştiğinde - useCallback ile optimize edilebilir)


  // === JSX KISMI (SENİN HTML'İNDEN UYARLANACAK) ===
  return (
    <section className="hero-section bg-secondary-dark py-8 mb-12">
      <div className="container mx-auto">
        {/* Üstteki 3 Kart */}
        <div className="top-projects-row flex flex-wrap md:flex-nowrap justify-between gap-4 sm:gap-5 mb-8">
          {topProjects.map((project) => (
            <Link href={project.href} key={project.id} className="top-project-link group block w-full md:w-1/3 rounded-lg relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-brand-purple">
              <div className="top-project-item bg-[#100C1C] rounded-lg flex flex-col h-full">
                <div className="top-project-banner w-full aspect-[16/7] relative overflow-hidden z-[1] bg-[#050308]">
                  <div className="banner-image-wrapper absolute inset-0 z-[2] overflow-hidden">
                    <Image src={project.bannerImageUrl} alt={`${project.title} Banner`} layout="fill" objectFit="cover" className="banner-main-image transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105" />
                  </div>
                  <div
                    className="banner-glow-effect absolute inset-0 bg-cover bg-center filter blur-md brightness-110 saturate-125 opacity-0 scale-115 transition-opacity duration-400 ease-out group-hover:opacity-65 group-hover:scale-105 z-[1]"
                    style={{ backgroundImage: `url(${project.bannerImageUrl})` }}
                  />
                </div>
                {/* Detaylar gizlenip hover'da açılmayacak, her zaman görünecek şekilde basitleştirildi */}
                <div className="top-project-details p-3 flex items-end gap-2.5 bg-gradient-to-t from-[rgba(16,12,28,0.95)] via-[rgba(16,12,28,0.7)] to-transparent absolute bottom-0 left-0 w-full z-[3] transition-opacity duration-300 ease-out group-hover:opacity-0 group-hover:translate-y-4 group-hover:pointer-events-none">
                  <Image src={project.coverImageUrl} alt={`${project.title} Kapak`} width={60} height={60} className="top-project-cover rounded border-2 border-black/30 shadow-md shrink-0" />
                  <div className="top-project-text flex flex-col justify-end flex-grow overflow-hidden">
                    <span className={`project-type inline-block self-start px-2 py-0.5 text-[0.65rem] font-semibold rounded uppercase tracking-wider mb-1 leading-none ${project.type === 'Oyun' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {project.type}
                    </span>
                    <span className="project-title font-semibold text-gray-50 text-base mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                      {project.title}
                    </span>
                    <span className="project-date text-gray-400 text-xs">
                      {project.date}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Ana Hero İçeriği */}
        <div className="main-hero-content flex flex-col lg:flex-row gap-5 items-stretch">
           <Link href={mainShowcase.detailsLink || '#'} id="mainShowcaseLink" className="hero-main-showcase-link group flex-grow shrink basis-0 rounded-xl overflow-hidden relative shadow-lg transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-xl block">
            <div className="hero-main-showcase w-full h-full relative flex bg-[#050308] aspect-[16/7.5] overflow-hidden">
              <div className={`hero-main-visual-wrapper absolute inset-0 overflow-hidden z-[1] transition-all duration-300 ease-in-out ${isVisualFading ? 'opacity-30 scale-110' : 'opacity-100 scale-100'}`}>
                {mainShowcase.mainImageUrl && (
                  <Image src={mainShowcase.mainImageUrl} alt={mainShowcase.title || 'Ana Proje Görseli'} layout="fill" objectFit="cover" className="transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-105" priority />
                )}
              </div>
              <div className="hero-main-visual-overlay absolute inset-0 bg-gradient-to-t from-[rgba(12,14,15,0.98)] via-40% via-[rgba(12,14,15,0.6)] to-transparent z-[2]"></div>
              
              {mainShowcase.coverImageUrl && (
                <div className={`absolute top-4 sm:top-6 left-4 sm:left-7 z-[3] transition-opacity duration-400 ease-in-out ${isCoverVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <Image src={mainShowcase.coverImageUrl} alt={`${mainShowcase.title || 'Proje'} Kapak`} width={100} height={100} className="main-showcase-cover-image w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] rounded-lg shadow-lg border-2 border-white/10 object-cover" />
                </div>
              )}

              <div className="hero-main-info-container absolute bottom-0 left-0 w-full p-4 sm:p-6 md:p-7 z-[3]">
                <div className={`hero-main-info text-white max-w-[calc(100%-100px)] sm:max-w-[calc(100%-150px)] transition-all duration-300 ease-in-out ${isInfoFading ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0'}`}>
                  {mainShowcase.category && (
                    <span className={`info-category inline-block px-2.5 py-1 text-[0.7rem] font-semibold rounded uppercase tracking-wider mb-2 sm:mb-3 ${mainShowcase.category === 'Oyun' ? 'bg-green-500/80' : 'bg-orange-500/80'}`}>
                      {mainShowcase.category}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-2 sm:mb-3 text-white">
                    {mainShowcase.title || 'Başlık Yükleniyor...'}
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-gray-200 mb-4 sm:mb-6 max-w-[90%] line-clamp-2 sm:line-clamp-3">
                    {mainShowcase.description || 'Açıklama yakında...'}
                  </p>
                  <div className="hero-main-actions flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button className="btn btn-primary btn-play-now bg-text-brand-purple text-white py-2.5 px-5 sm:py-3 sm:px-7 text-xs sm:text-sm font-medium rounded-lg uppercase tracking-wider hover:bg-purple-500 hover:-translate-y-0.5 hover:shadow-lg-purple transition-all flex items-center justify-center">
                      <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Şimdi Oyna
                    </button>
                    <Link href={mainShowcase.detailsLink || '#'} className="btn btn-secondary btn-details bg-white/10 text-white border border-white/20 py-2.5 px-5 sm:py-3 sm:px-7 text-xs sm:text-sm font-medium rounded-lg uppercase tracking-wider hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5 transition-all flex items-center justify-center">
                      Detaylar <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Sağ Mini Kartlar */}
          {sideListItems.length > 0 && (
            <aside ref={heroSideListRef} className="hero-side-list shrink-0 basis-full lg:basis-[280px] flex flex-col gap-2 md:gap-2.5 lg:ml-5">
              {sideListItems.map((item, index) => (
                <button
                  key={item.index}
                  onClick={(e) => handleSideItemClick(item.index, e)}
                  className={`side-list-item-link w-full rounded-lg transition-all duration-200 ease-out relative overflow-hidden bg-[#100C1C] flex-grow flex group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-text-brand-purple
                              ${index === activeSideItemIndex ? 'ring-2 ring-text-brand-purple shadow-lg-purple-intense bg-[#181428]' : 'hover:bg-[#140F22]'}`}
                  // Senin HTML'indeki :hover efektlerini Tailwind group-hover ile yapmaya çalışacağız.
                  // Veya CSS'teki .side-list-item-link:hover::before efektini pseudo-elements için Tailwind'e ekleyebilirsin (tailwind.config.ts)
                  // Şimdilik hover:bg-[#140F22] gibi basit bir hover ekledim.
                >
                  <div className="side-list-item flex items-center w-full p-1.5 sm:p-2 relative z-[1]">
                    <Image src={item.cover} alt={`${item.cardTitle} Kapak`} width={50} height={50} className="side-item-cover w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-md mr-2 sm:mr-2.5 shrink-0 z-[2] border border-white/5 object-cover" />
                    <div className="side-item-main-content flex-grow relative z-[2] flex flex-col justify-center overflow-hidden">
                      <span className={`project-type text-[0.6rem] sm:text-[0.65em] px-1.5 py-0.5 self-start rounded leading-none mb-0.5 ${item.type === 'Oyun' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                        {item.type}
                      </span>
                      <span className="side-item-title text-gray-200 text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                        {item.cardTitle}
                      </span>
                    </div>
                    <div className="side-item-banner-background absolute top-0 right-0 w-[65%] sm:w-[70%] h-full bg-cover bg-right z-[1] rounded-r-lg overflow-hidden opacity-70 group-hover:opacity-90 transition-opacity" style={{ backgroundImage: `url(${item.banner})` }}>
                      <div className="side-item-banner-fade-to-left absolute inset-0 bg-gradient-to-l from-transparent via-[rgba(16,12,28,0.6)] to-80% to-[#100C1C]"></div>
                    </div>
                  </div>
                  {/* Aktif kart için özel bir parlama veya kenarlık efekti Tailwind ile eklenebilir */}
                   {index === activeSideItemIndex && (
                     <div className="absolute inset-0 border-2 border-text-brand-purple rounded-lg pointer-events-none opacity-70"></div>
                   )}
                </button>
              ))}
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}