// src/components/home/SiteStatsSection.tsx
"use client";

import React, { useEffect, useState } from 'react';

// StatIcon component'i aynı kalabilir
interface StatIconProps {
  iconClass: string;
  sizeClasses: string;
  animationClass: string;
  wrapperClass?: string;
}

const StatIcon: React.FC<StatIconProps> = ({ iconClass, sizeClasses, animationClass, wrapperClass }) => {
  const [isGlowing, setIsGlowing] = useState(false);
  useEffect(() => {
    const minDelay = 2000; const maxDelay = 8000;
    const glowInDuration = 1000; const glowStayDuration = 1000; const glowOutDuration = 1000;
    let glowTimeoutId: NodeJS.Timeout; let splayTimeoutId: NodeJS.Timeout; let resetTimeoutId: NodeJS.Timeout;
    const startRandomGlow = () => {
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      glowTimeoutId = setTimeout(() => {
        setIsGlowing(true);
        splayTimeoutId = setTimeout(() => {
          setIsGlowing(false);
          resetTimeoutId = setTimeout(startRandomGlow, glowOutDuration);
        }, glowInDuration + glowStayDuration);
      }, randomDelay);
    };
    startRandomGlow();
    return () => {
      clearTimeout(glowTimeoutId); clearTimeout(splayTimeoutId); clearTimeout(resetTimeoutId);
      setIsGlowing(false);
    };
  }, []);

  return (
    <div className={`stat-icon-wrapper ${wrapperClass || ''}`}>
      <div
        className={`stat-icon bg-stats-icon-bg border border-stats-icon-border rounded-full 
                    flex items-center justify-center transition-all duration-1000 ease-in-out
                    ${sizeClasses} ${animationClass} ${isGlowing ? 'shadow-stats-icon-glow-main' : ''}`}
      >
        <i className={`${iconClass} text-stats-icon-text`}></i>
      </div>
    </div>
  );
};


// API'den dönecek istatistik verisi için tip
interface SiteStatistics {
  totalUsers: number;
  totalDubbedGames: number;
  totalDubbedAnime: number;
  totalTeamMembers: number;
  totalGameRequests: number;
  // totalAnimeRequests?: number; // Eğer API'den geliyorsa
}

// API'den istatistikleri çekme fonksiyonu
async function fetchSiteStats(): Promise<SiteStatistics | null> {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) {
      console.error(`Site istatistikleri çekilemedi, status: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Site istatistikleri fetch hatası:", error);
    return null;
  }
}

const SiteStatsSection = () => {
  const [statsData, setStatsData] = useState<SiteStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      const data = await fetchSiteStats();
      setStatsData(data);
      setIsLoading(false);
    };
    loadStats();
  }, []);

  // İkon verileri aynı kalabilir
  const leftIcons = [
    { id: 'users', iconClass: 'fas fa-users', size: 'w-16 h-16 text-2xl md:w-20 md:h-20 md:text-3xl', anim: 'animate-wobble-1' },
    { id: 'mic', iconClass: 'fas fa-microphone-alt', size: 'w-[75px] h-[75px] text-3xl md:w-24 md:h-24 md:text-4xl', anim: 'animate-wobble-3' },
  ];
  const rightIcons = [
    { id: 'gamepad', iconClass: 'fas fa-gamepad', size: 'w-24 h-24 text-4xl md:w-28 md:h-28 md:text-5xl', anim: 'animate-wobble-2-main', isMain: true },
    { id: 'film', iconClass: 'fas fa-film', size: 'w-[65px] h-[65px] text-2xl md:w-[75px] md:h-[75px] md:text-3xl', anim: 'animate-wobble-4' },
  ];

  // Sayıları formatlamak için yardımcı fonksiyon
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '0'; // Veya 'N/A'
    return num.toLocaleString('tr-TR'); // Türkçe formatında binlik ayraçlı
  };

  // Dinamik istatistik metinleri
  const statsListItems = statsData ? [
    `${formatNumber(statsData.totalUsers)} Adet Kullanıcı`,
    `${formatNumber(statsData.totalDubbedGames)} Adet Türkçe Dublaj Oyun`,
    `${formatNumber(statsData.totalDubbedAnime)} Adet Türkçe Dublaj Anime`,
    `${formatNumber(statsData.totalTeamMembers)} Adet Ekip Üyesi`,
    `${formatNumber(statsData.totalGameRequests)} Adet İstek Oyun`,
  ] : [
    "Veriler yükleniyor...", // Yüklenirken gösterilecek metinler
    "Veriler yükleniyor...",
    "Veriler yükleniyor...",
    "Veriler yükleniyor...",
    "Veriler yükleniyor...",
  ];


  // tailwind.config.js'de bu renklerin tanımlı olması beklenir:
  // bg-section-bg-alt, text-dublio-text-primary, text-dublio-text-secondary,
  // bg-stats-icon-bg, border-stats-icon-border, text-stats-icon-text,
  // shadow-stats-icon-glow-main, bg-stats-divider-color, text-stats-footer-text-color

  return (
    <section className="site-stats-section bg-section-bg-alt py-16 md:py-20 relative">
      <div className="container mx-auto stats-container flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4">
        <div className="stats-icon-column flex flex-row lg:flex-col items-center justify-center gap-5 md:gap-8">
          {leftIcons.map(icon => (
            <StatIcon key={icon.id} iconClass={icon.iconClass} sizeClasses={icon.size} animationClass={icon.anim} />
          ))}
        </div>

        <div className="stats-info-content text-center lg:max-w-md xl:max-w-lg">
          <h2 className="section-title stats-title text-2xl sm:text-3xl md:text-4xl font-semibold text-dublio-text-primary mb-5 md:mb-6">
            Sitemizde Şu An;
          </h2>
          {isLoading ? (
            <ul className="stats-list space-y-2 text-base sm:text-lg text-dublio-text-secondary mb-5 md:mb-6">
                {[...Array(5)].map((_, i) => <li key={i} className="h-6 bg-gray-700/50 rounded animate-pulse w-3/4 mx-auto"></li>)}
            </ul>
          ) : statsData ? (
            <ul className="stats-list space-y-2 text-base sm:text-lg text-dublio-text-secondary mb-5 md:mb-6">
              {statsListItems.map((stat, index) => (
                <li key={index}>{stat}</li>
              ))}
            </ul>
          ) : (
            <p className="text-dublio-text-dark">İstatistikler yüklenemedi.</p>
          )}
          <p className="stats-footer-text text-sm sm:text-base text-stats-footer-text-color">
            Bulunmaktadır.
          </p>
        </div>

        <div className="stats-icon-column flex flex-row lg:flex-col items-center justify-center gap-5 md:gap-8">
          {rightIcons.map(icon => (
            <StatIcon 
              key={icon.id} 
              iconClass={icon.iconClass} 
              sizeClasses={icon.size}
              animationClass={icon.anim} 
            />
          ))}
        </div>
      </div>
      <div className="section-divider bottom-divider absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 max-w-screen-xl h-px bg-stats-divider-color opacity-50"></div>
    </section>
  );
};

export default SiteStatsSection;