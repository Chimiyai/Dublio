// src/components/home/SiteStatsSection.tsx
'use client'; // Animasyonlar için client component olabilir

import { UsersIcon, MicrophoneIcon, PuzzlePieceIcon, FilmIcon } from '@heroicons/react/24/outline'; // Veya solid, veya FontAwesome
import { useEffect, useRef } from 'react';

interface SiteStatsSectionProps {
  stats: {
    users: string;
    dubbedGames: number;
    dubbedAnimes: number;
    teamMembers: number;
    requestedGames: number;
  };
}

export default function SiteStatsSection({ stats }: SiteStatsSectionProps) {
  // İkon sallanma efekti için (opsiyonel, CSS ile de yapılabilir veya bir kütüphane ile)
  // Ya da basitçe CSS animasyonu olarak bırakılabilir.
  // Senin JS'deki kompleks pozisyonlama ve glow mantığını burada basitleştiriyorum.
  // Ana fikir, ikonları ve sayıları göstermek.

  const statItems = [
    { label: "Adet Kullanıcı", value: stats.users, Icon: UsersIcon },
    { label: "Adet Türkçe Dublaj Oyun", value: stats.dubbedGames, Icon: PuzzlePieceIcon },
    { label: "Adet Türkçe Dublaj Anime", value: stats.dubbedAnimes, Icon: FilmIcon },
    { label: "Adet Ekip Üyesi", value: stats.teamMembers, Icon: MicrophoneIcon },
    { label: "Adet İstek Oyun", value: stats.requestedGames, Icon: UsersIcon }, // Tekrar eden ikon olabilir
  ];


  return (
    <section className="site-stats-section bg-bg-primary-dark py-16 sm:py-20 md:py-24 relative">
      {/* Üst ayraç çizgisi */}
      {/* <div className="section-divider top-divider absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-screen-lg h-px bg-gray-700/50 opacity-50"></div> */}
      
      <div className="container stats-container mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16">
        {/* Sol İkonlar (Dekoratif, istersen ekleyebilirsin) */}
        {/* <div className="stats-icon-column hidden md:flex flex-col gap-8">
          <div className="stat-icon-wrapper p-4 bg-secondary-dark/50 border border-gray-700/30 rounded-full shadow-lg animate-pulse"> <UsersIcon className="w-8 h-8 text-text-brand-purple" /> </div>
          <div className="stat-icon-wrapper p-5 bg-secondary-dark/50 border border-gray-700/30 rounded-full shadow-lg animate-pulse delay-200"> <MicrophoneIcon className="w-10 h-10 text-text-brand-purple" /> </div>
        </div> */}

        <div className="stats-info-content text-center">
          <h2 className="section-title stats-title text-3xl sm:text-4xl font-bold text-gray-100 mb-8">
            Sitemizde Şuan;
          </h2>
          <ul className="stats-list space-y-3 text-lg sm:text-xl text-gray-300">
            {statItems.map(item => (
              <li key={item.label}>
                <span className="font-semibold text-white">{typeof item.value === 'number' ? item.value.toLocaleString('tr-TR') : item.value}</span> {item.label}
              </li>
            ))}
          </ul>
          <p className="stats-footer-text text-base text-gray-400 mt-8">Bulunmaktadır.</p>
        </div>

        {/* Sağ İkonlar (Dekoratif) */}
        {/* <div className="stats-icon-column hidden md:flex flex-col gap-8 items-center">
            <div className="stat-icon-wrapper p-6 bg-secondary-dark/50 border border-gray-700/30 rounded-full shadow-xl animate-pulse delay-100"> <PuzzlePieceIcon className="w-12 h-12 text-text-brand-purple" /> </div>
            <div className="stat-icon-wrapper p-4 bg-secondary-dark/50 border border-gray-700/30 rounded-full shadow-lg animate-pulse delay-300"> <FilmIcon className="w-8 h-8 text-text-brand-purple" /> </div>
        </div> */}
      </div>
      
      {/* Alt ayraç çizgisi */}
      {/* <div className="section-divider bottom-divider absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 max-w-screen-lg h-px bg-gray-700/50 opacity-50"></div> */}
    </section>
  );
}