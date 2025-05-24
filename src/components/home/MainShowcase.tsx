// src/components/home/MainShowcase.tsx
"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MainShowcaseProps {
  // ... (proplar aynı)
  category: 'Oyun' | 'Anime' | 'Öne Çıkan';
  title: string;
  description: string;
  imageUrl: string;
  coverUrl: string;
  detailsUrl: string;
}

const MainShowcase: React.FC<MainShowcaseProps> = ({ 
  category, title, description, imageUrl, coverUrl, detailsUrl 
}) => {
  let categoryClass = 'bg-hero-info-category-bg';
  if (category === 'Oyun') categoryClass = 'bg-project-type-oyun';
  else if (category === 'Anime') categoryClass = 'bg-project-type-anime';


  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Key değişimiyle component yeniden mount olduğunda bu direkt çalışacak.
    // Giriş animasyonunu başlatmak için animateIn'i true yap.
    // Çok kısa bir gecikme, stillerin ilk render'da uygulanıp sonra değişmesi için.
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 20); // 20ms veya 50ms gibi küçük bir değer.
    return () => clearTimeout(timer);
  }, [title, imageUrl]); // Her yeni kart geldiğinde (proplar değiştiğinde) tetiklenir.

  const transitionBase = "transition-all duration-500 ease-out";
  
  // Giriş Stilleri
  // Başlangıçta görünür ama transform ile dışarıda olabilir, sonra içeri kayar.
  // Ya da opacity ile başlar. Şimdiki opacity-0 iyi.
  const initialStyles = "opacity-0 translate-x-8"; 
  const finalStyles = "opacity-100 translate-x-0";
  
  const bgImageInitial = "opacity-0 scale-105"; 
  const bgImageFinal = "opacity-100 scale-100";
  const coverImageInitial = "opacity-0 scale-90"; 
  const coverImageFinal = "opacity-100 scale-100";
  const textBlockInitial = "opacity-0 translate-x-6";
  const textBlockFinal = "opacity-100 translate-x-0";

  return (
    <div className={`w-full h-full ${transitionBase} ${animateIn ? finalStyles : initialStyles}`}>
      <Link href={detailsUrl} className="hero-main-showcase-link block rounded-xl overflow-hidden relative shadow-hero-main-showcase group w-full h-full">
        <div className="hero-main-showcase w-full h-full relative flex 
                         bg-hero-main-showcase-bg 
                         aspect-[4/3] // Mobil için daha uygun aspect ratio
                         sm:aspect-video 
                         lg:aspect-16/7.5 
                         overflow-hidden">
          {/* Arka Plan Resmi */}
          <div className={`hero-main-visual-wrapper absolute inset-0 overflow-hidden z-[1] 
                           ${transitionBase} delay-100
                           ${animateIn ? bgImageFinal : bgImageInitial}`}>
            <Image src={imageUrl} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="hero-main-visual-overlay absolute inset-0 bg-hero-main-visual-overlay z-[2]"></div>
          </div>

          {/* Kapak Resmi */}
          <Image
            src={coverUrl} 
            alt={`${title} Kapak`} 
            width={60} height={60} 
            className={`main-showcase-cover-image absolute 
                        top-2 left-2 // Mobil için daha küçük padding
                        sm:top-3 sm:left-3
                        lg:top-6 lg:left-7
                        w-[50px] h-[50px] // Mobil için daha küçük
                        sm:w-[60px] sm:h-[60px] 
                        lg:w-[80px] lg:h-[80px] 
                        xl:w-[100px] xl:h-[100px]
                        object-cover rounded-md sm:rounded-lg shadow-lg z-[30] 
                        border-2 border-white/10
                        ${transitionBase} delay-200
                        ${animateIn ? coverImageFinal : coverImageInitial}`}
          />

          {/* Yazı Alanı */}
          <div className={`hero-main-info-container absolute bottom-0 left-0 w-full p-3 pt-[70px] sm:pt-4 sm:p-4 md:p-6 lg:p-7 z-[20] /* Mobil için pt-[70px] (kapak+boşluk) */
                           ${transitionBase} delay-150 
                           ${animateIn ? textBlockFinal : textBlockInitial}`}>
            <div className="hero-main-info text-white w-full 
                            lg:max-w-[calc(100%-120px)] xl:max-w-[calc(100%-150px)] 
                            flex flex-col">
                <div className="mb-2 sm:mb-3">
                    <span className={`info-category ${categoryClass} text-white inline-block text-[0.6rem] sm:text-xs font-semibold rounded uppercase tracking-wider px-1.5 py-0.5 sm:px-2 sm:py-1 mb-1.5 sm:mb-2`}>{category}</span>
                    <h2 className="text-base // Mobil için daha küçük
                        sm:text-lg 
                        md:text-xl 
                        lg:text-2xl 
                        xl:text-3xl 
                        font-bold leading-tight 
                        text-shadow-md">
                      {title}
                    </h2>
                </div>
                <p className="text-xs 
    sm:text-sm 
    lg:text-base 
    leading-relaxed 
    text-prestij-text-primary 
    mb-2 sm:mb-3 
    w-full 
    line-clamp-2 
    md:line-clamp-3 
    text-shadow-sm">
  {description}
</p>
                <div className="hero-main-actions flex flex-col items-start gap-2 sm:flex-row sm:gap-2.5 md:gap-3.5">
                    <button className="btn btn-primary btn-play-now bg-prestij-purple text-white border-none 
                                     text-[0.7rem] sm:text-xs md:text-sm font-medium 
                                     py-1.5 px-3 sm:py-2 sm:px-4 md:py-2.5 md:px-6 rounded-md uppercase tracking-wider 
                                     hover:bg-hero-btn-play-bg-hover hover:-translate-y-0.5 hover:shadow-lg-purple transition-all duration-200">
                      <i className="fas fa-play mr-1 md:mr-2 text-[0.6rem] sm:text-xs"></i> Şimdi Oyna
                    </button>
                    <button className="btn btn-secondary btn-details bg-hero-btn-details-bg text-white border border-hero-btn-details-border 
                                     text-[0.7rem] sm:text-xs md:text-sm font-medium 
                                     py-1.5 px-3 sm:py-2 sm:px-4 md:py-2.5 md:px-6 rounded-md uppercase tracking-wider 
                                     hover:bg-hero-btn-details-bg-hover hover:border-white/30 hover:-translate-y-0.5 transition-all duration-200">
                      Detaylar <i className="fas fa-arrow-right ml-1 md:ml-2 text-[0.6rem] sm:text-xs"></i>
                    </button>
                </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
export default MainShowcase;