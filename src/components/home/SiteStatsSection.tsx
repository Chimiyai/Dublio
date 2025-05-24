// src/components/home/SiteStatsSection.tsx
"use client";

import React, { useEffect, useState } from 'react';

interface StatIconProps {
  iconClass: string; // Örn: "fas fa-users"
  sizeClasses: string; // Örn: "w-16 h-16 text-2xl"
  animationClass: string; // Örn: "animate-wobble-1"
  wrapperClass?: string; // Ek pozisyonlama için
}

const StatIcon: React.FC<StatIconProps> = ({ iconClass, sizeClasses, animationClass, wrapperClass }) => {
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    const minDelay = 2000; // Minimum bekleme süresi
    const maxDelay = 8000; // Maksimum bekleme süresi
    const glowInDuration = 1000;  // Parlarken geçecek süre
    const glowStayDuration = 1000; // Parlak kalma süresi
    const glowOutDuration = 1000;  // Sönerken geçecek süre

    const startRandomGlow = () => {
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      
      setTimeout(() => {
        // Parlama başlangıcı
        setIsGlowing(true);
        
        // Sönme başlangıcı (parlama + kalma süresinden sonra)
        setTimeout(() => {
          setIsGlowing(false);
          
          // Yeni döngü (sönme bittikten sonra)
          setTimeout(() => {
            startRandomGlow();
          }, glowOutDuration);
          
        }, glowInDuration + glowStayDuration);
        
      }, randomDelay);
    };

    startRandomGlow();

    return () => {
      setIsGlowing(false);
    };
  }, []);

  return (
    <div className={`stat-icon-wrapper ${wrapperClass || ''}`}>
      <div
        className={`
          stat-icon 
          bg-stats-icon-bg 
          border border-stats-icon-border 
          rounded-full 
          flex items-center justify-center 
          transition-all duration-1000 ease-in-out
          ${sizeClasses} 
          ${animationClass}
          ${isGlowing ? 'shadow-stats-icon-glow-main' : ''}
        `}
      >
        <i className={`${iconClass} text-stats-icon-text`}></i>
      </div>
    </div>
  );
};


const SiteStatsSection = () => {
  // İkonlar için veriler
  const leftIcons = [
    { id: 'users', iconClass: 'fas fa-users', size: 'w-16 h-16 text-2xl md:w-20 md:h-20 md:text-3xl', anim: 'animate-wobble-1' }, // Orijinal: w:60, font:1.8em
    { id: 'mic', iconClass: 'fas fa-microphone-alt', size: 'w-[75px] h-[75px] text-3xl md:w-24 md:h-24 md:text-4xl', anim: 'animate-wobble-3' }, // Orijinal: w:75, font:2.2em
  ];
  const rightIcons = [
    { id: 'gamepad', iconClass: 'fas fa-gamepad', size: 'w-24 h-24 text-4xl md:w-28 md:h-28 md:text-5xl', anim: 'animate-wobble-2-main', isMain: true },
    { id: 'film', iconClass: 'fas fa-film', size: 'w-[65px] h-[65px] text-2xl md:w-[75px] md:h-[75px] md:text-3xl', anim: 'animate-wobble-4' }, // Orijinal: w:65, font:1.9em
  ];

  const stats = [
    "1,854,165 Adet Kullanıcı",
    "1,651 Adet Türkçe Dublaj Oyun",
    "121 Adet Türkçe Dublaj Anime",
    "1,561 Adet Ekip Üyesi",
    "12,312 Adet İstek Oyun",
  ];

  return (
    <section className="site-stats-section bg-section-bg-alt py-16 md:py-20 relative">
      {/* Üst Ayraç (Opsiyonel) */}
      {/* <div className="section-divider top-divider absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-screen-xl h-px bg-stats-divider-color opacity-50"></div> */}
      
      <div className="container mx-auto stats-container flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4">
        {/* Sol İkon Sütunu */}
        <div className="stats-icon-column flex flex-row lg:flex-col items-center justify-center gap-5 md:gap-8">
          {leftIcons.map(icon => (
            <StatIcon key={icon.id} iconClass={icon.iconClass} sizeClasses={icon.size} animationClass={icon.anim} />
          ))}
        </div>

        {/* Orta Metin İçeriği */}
        <div className="stats-info-content text-center lg:max-w-md xl:max-w-lg">
          <h2 className="section-title stats-title text-2xl sm:text-3xl md:text-4xl font-semibold text-prestij-text-primary mb-5 md:mb-6">
            Sitemizde Şuan;
          </h2>
          <ul className="stats-list space-y-2 text-base sm:text-lg text-prestij-text-secondary mb-5 md:mb-6">
            {stats.map((stat, index) => (
              <li key={index}>{stat}</li>
            ))}
          </ul>
          <p className="stats-footer-text text-sm sm:text-base text-stats-footer-text-color">
            Bulunmaktadır.
          </p>
        </div>

        {/* Sağ İkon Sütunu */}
        <div className="stats-icon-column flex flex-row lg:flex-col items-center justify-center gap-5 md:gap-8">
          {rightIcons.map(icon => (
            <StatIcon 
              key={icon.id} 
              iconClass={icon.iconClass} 
              sizeClasses={icon.size}
              animationClass={icon.anim} 
              wrapperClass={icon.isMain ? '' : ''} // Ana ikon için sürekli glow efekti
            />
          ))}
        </div>
      </div>

      {/* Alt Ayraç */}
      <div className="section-divider bottom-divider absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 max-w-screen-xl h-px bg-stats-divider-color opacity-50"></div>
    </section>
  );
};



export default SiteStatsSection;