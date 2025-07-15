// src/components/home/MainShowcase.tsx
"use client";
import React, { useEffect, useState, useRef } from 'react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary'; // Import et
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

export interface MainShowcaseProps {
  category: 'Oyun' | 'Anime' | 'Öne Çıkan' | string;
  title: string;
  description: string;
  imageUrl?: string | null | undefined; // API'den gelen bannerImagePublicId veya placeholder
  coverUrl?: string | null | undefined; // API'den gelen coverImagePublicId veya placeholder
  detailsUrl: string;
  releaseDate?: string | Date | null;
  showcaseKey: string;
}

// Animasyon Süreleri (tailwind.config.ts'deki durationlarla eşleşmeli)
const VISUAL_FADE_DURATION = 500; // ms (duration-500) - opacity ve transform için
const VISUAL_SCALE_DURATION = 800; // ms (duration-800) - sadece görselin scale'i için
const INFO_FADE_DURATION = 500;    // ms (duration-500)
const COVER_FADE_DURATION = 400;   // ms (duration-400)
const CONTENT_UPDATE_DELAY = 300;  // ms - fadeOut bittikten sonra içeriğin güncellenme gecikmesi

const MainShowcase: React.FC<MainShowcaseProps> = (props) => {
  const {
    category: newCategory,
    title: newTitle,
    description: newDescription,
    imageUrl: newImageUrl, // Bu prop artık Cloudinary ID'si veya placeholder yolu alacak
    coverUrl: newCoverUrl,   // Bu prop artık Cloudinary ID'si veya placeholder yolu alacak
    detailsUrl: newDetailsUrl,
    releaseDate: newReleaseDate,
    showcaseKey: newShowcaseKey,
  } = props;

  const [displayData, setDisplayData] = useState({
    category: newCategory,
    title: newTitle,
    description: newDescription,
    imageUrl: newImageUrl, // State'e ID veya yolu ata
    coverUrl: newCoverUrl,   // State'e ID veya yolu ata
    detailsUrl: newDetailsUrl,
    releaseDate: newReleaseDate,
    key: newShowcaseKey,
  });

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(true); // Başlangıçta içerik yüklü

  const prevShowcaseKeyRef = useRef<string | undefined>(undefined); // Başlangıçta undefined
  const isInitialMountRef = useRef(true); // İlk mount kontrolü için
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {

    if (isInitialMountRef.current) {
      // İlk mount'ta, prevShowcaseKey'i set et ve çık. Animasyon yok.
      // displayData zaten başlangıç props'larıyla set edildi.
      prevShowcaseKeyRef.current = newShowcaseKey;
      isInitialMountRef.current = false;
      return;
    }

    // İlk mount değilse ve key gerçekten değiştiyse animasyonu başlat
    // (ve prevShowcaseKeyRef.current undefined değilse, ki ilk mount sonrası olmayacak)
    if (prevShowcaseKeyRef.current !== newShowcaseKey && prevShowcaseKeyRef.current !== undefined) {
      // console.log(`%cKey changed! From ${prevShowcaseKeyRef.current} to ${newShowcaseKey}. Starting fade out.`, "color: orange; font-weight: bold;");
      setIsFadingOut(true);
      setIsContentLoaded(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // console.log(`%cTimeout: Updating displayData with new props (key: ${newShowcaseKey}). Starting fade in.`, "color: green; font-weight: bold;");
        setDisplayData({
          category: newCategory, title: newTitle, description: newDescription,
          imageUrl: newImageUrl, // YENİ ID VEYA YOLU ATA
          coverUrl: newCoverUrl,   // YENİ ID VEYA YOLU ATA
          detailsUrl: newDetailsUrl, releaseDate: newReleaseDate, key: newShowcaseKey,
        });
        setIsFadingOut(false);
        requestAnimationFrame(() => { setIsContentLoaded(true); });
      }, 300); // CONTENT_UPDATE_DELAY
    }

    // Her useEffect çalışmasından sonra (key değişse de değişmese de) prev key'i güncelle
    // Bu, bir sonraki key değişimini doğru algılamak için önemli.
    prevShowcaseKeyRef.current = newShowcaseKey;
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [newShowcaseKey, newCategory, newTitle, newDescription, newImageUrl, newCoverUrl, newDetailsUrl, newReleaseDate]);


  let categoryTypeClass = 'bg-gray-700';
  const normalizedCategory = displayData.category.toLowerCase();
  if (normalizedCategory === 'oyun') categoryTypeClass = 'bg-dublio-type-game';
  else if (normalizedCategory === 'anime') categoryTypeClass = 'bg-dublio-type-anime';
  else if (normalizedCategory === 'öne çıkan') categoryTypeClass = 'bg-dublio-purple';

  const visualWrapperClasses = cn(
    "hero-main-visual-wrapper absolute inset-0 overflow-hidden z-[1]",
    "transition-all duration-1000 ease-linear", // Şimdilik bu kalsın
    {
      "opacity-30 scale-110": isFadingOut, // Wrapper'ın kendi opaklığı ve scale'i
      "opacity-100 scale-100": !isFadingOut && isContentLoaded,
      "opacity-0 scale-105": !isFadingOut && !isContentLoaded,
    }
  );

  const fadeOutOverlayClasses = cn(
    "absolute inset-0 z-[3] bg-black transition-opacity duration-500 ease-in-out", // duration-500 veya CONTENT_UPDATE_DELAY'e yakın
    {
      "opacity-60": isFadingOut, // Fade out sırasında %60 siyah overlay (ayarlayabilirsiniz)
      "opacity-0": !isFadingOut, // Normalde görünmez
    }
  );
  // Cloudinary ID'lerini veya placeholder yollarını URL'ye çevir
  const finalImageSrc = getCloudinaryImageUrlOptimized(
    displayData.imageUrl, // displayData'dan ID veya yolu al
    { width: 1200, height: 675, crop: 'fill', quality: 'auto', format: 'auto' },
    'banner'
  );
  const finalCoverSrc = getCloudinaryImageUrlOptimized(
  displayData.coverUrl,
  { width: 100, height: 100 }, // SADECE width ve height
  'cover'
);


  const formattedDisplayDate = formatDate(displayData.releaseDate);

  return (
    <Link
      href={displayData.detailsUrl}
      className="hero-main-showcase-link group block rounded-lg sm:rounded-xl overflow-hidden relative shadow-lg w-full h-full
                 transition-transform duration-300 ease-out hover:-translate-y-1 sm:hover:-translate-y-1.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] sm:hover:shadow-[0_12px_35px_rgba(0,0,0,0.2)]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dublio-purple focus-visible:ring-offset-2 focus-visible:ring-offset-dublio-bg-dark-3"
    >
      <div className="hero-main-showcase w-full h-full relative flex bg-dublio-bg-dark-2 aspect-[4/3] xs:aspect-[16/9] sm:aspect-video lg:aspect-[16/7.5] overflow-hidden">
        <div className={visualWrapperClasses}>
          <Image
            key={`banner-${displayData.key}`} // Bu key önemli, src değişince Image'ın yeniden render olmasını sağlar
            src={finalImageSrc} // DÖNÜŞTÜRÜLMÜŞ URL
            alt={displayData.title || 'Ana Proje Görseli'}
            fill
            className="object-cover w-full h-full transition-transform duration-800 ease-hero-visual-ease group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 70vw" // Responsive sizes
            priority // LCP elementi olabilir
          />
          <div
            className="hero-main-visual-overlay absolute inset-0 z-[2]"
            style={{ background: 'linear-gradient(to top, rgba(12, 14, 15, 0.95) 0%, rgba(12, 14, 15, 0.6) 35%, transparent 65%)' }}
          />
          <div className={fadeOutOverlayClasses} />
        </div>

        <Image
    key={`cover-${displayData.key}`}
    src={finalCoverSrc} // Üretilen URL
    alt={`${displayData.title} Kapak`}
    width={100} // Bunlar Image component'inin layout için kullandığı base boyutlar
    height={100}
    className={cn(
                "main-showcase-cover-image absolute object-cover rounded-md sm:rounded-lg shadow-lg z-[3] border-2 border-white/10",
                "w-[60px] h-[60px] top-3 left-3",
                "sm:w-[70px] sm:h-[70px] sm:top-4 sm:left-4",
                "md:w-[80px] md:h-[80px] md:top-5 md:left-5",
                "lg:w-[100px] lg:h-[100px] lg:top-[25px] lg:left-[30px]",
                `transition-opacity duration-400 ease-in-out`, // COVER_FADE_DURATION
                {
                  "opacity-0": isFadingOut || !isContentLoaded,
                  "opacity-100": !isFadingOut && isContentLoaded,
                }
              )}
        />

        {/* Yazı Alanı (Responsive) */}
        <div className={cn(
            "hero-main-info-container absolute bottom-0 left-0 w-full box-border z-[3]",
            "px-3 pb-3 pt-[calc(60px+12px+8px)]", 
            "sm:px-4 sm:pb-4 sm:pt-[calc(70px+16px+10px)]",
            "md:px-5 md:pb-5 md:pt-[calc(80px+20px+12px)]",
            "lg:px-[30px] lg:pb-[25px] lg:pt-[calc(100px+25px+15px)]",
            `transition-all duration-500 ease-in-out`, // INFO_FADE_DURATION
            {
              "opacity-0 translate-y-3 sm:translate-y-5": isFadingOut || !isContentLoaded,
              "opacity-100 translate-y-0": !isFadingOut && isContentLoaded,
            }
          )}>
          <div className="hero-main-info text-white w-full sm:max-w-[calc(100%-100px)] md:max-w-[calc(100%-120px)] lg:max-w-[calc(100%-150px)]">
            <span
              className={cn(
                "info-category inline-block text-white font-semibold rounded uppercase tracking-wider",
                "text-[0.65em] px-2 py-0.5 mb-2",
                "sm:text-[0.7em] sm:px-2.5 sm:py-1 sm:mb-2.5",
                "lg:text-[0.75em] lg:px-[10px] lg:py-1 lg:mb-3",
                categoryTypeClass,
              )}
            >
              {displayData.category}
            </span>
            <h2 className={cn("font-bold leading-tight text-white text-shadow-md",
                "text-xl mb-1.5", 
                "sm:text-2xl sm:mb-2",
                "md:text-3xl md:mb-2.5",
                "lg:text-[2.8em] lg:leading-[1.1] lg:mb-3 xl:mb-4"
            )}>
              {displayData.title}
            </h2>
            <p className={cn("leading-normal text-gray-200/80 text-shadow-sm",
                "text-xs mb-3 line-clamp-2",
                "sm:text-sm sm:mb-4 sm:line-clamp-2",
                "md:line-clamp-3",
                "lg:text-[1.05em] lg:leading-[1.6] lg:mb-5 xl:mb-6 lg:max-w-[90%]"
            )}>
              {displayData.description}
            </p>
            <div className="hero-main-actions flex flex-row items-center gap-2 sm:gap-3">
  <button className={cn(
    "btn btn-primary btn-play-now bg-dublio-purple text-white border-none",
    "font-medium rounded-md uppercase tracking-wider whitespace-nowrap",
    "hover:bg-dublio-purple-darker hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(139,78,255,0.3)]",
    "transition-all duration-200",
    "text-[0.7em] py-1.5 px-3", // Daha küçük padding ve font
    "sm:text-[0.75em] sm:py-2 sm:px-4",
    "lg:text-[0.8em] lg:py-2 lg:px-5",
    "mb-2"
  )}>
    <i className="fas fa-play mr-1.5"></i> Oyna
  </button>

  <button className={cn(
    "btn btn-secondary btn-details bg-white/10 hover:bg-white/20 text-white",
    "border border-white/20 hover:border-white/30",
    "font-medium rounded-md uppercase tracking-wider whitespace-nowrap",
    "hover:-translate-y-0.5 transition-all duration-200",
    "text-[0.7em] py-1.5 px-3", // Daha küçük padding ve font
    "sm:text-[0.75em] sm:py-2 sm:px-4",
    "lg:text-[0.8em] lg:py-2 lg:px-5",
    "mb-2"
  )}>
    Detaylar <i className="fas fa-arrow-right ml-1.5"></i>
  </button>
</div>
            {formattedDisplayDate && (
              <div className={cn("project-release-date text-gray-300/70",
                "text-[0.7em]", 
                "sm:text-xs",
                "lg:text-sm"
              )}>
                Yayın Tarihi: {formattedDisplayDate}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MainShowcase;