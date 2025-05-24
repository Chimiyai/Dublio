// src/components/home/SuggestGameSection.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import SuggestOptionCard from './SuggestOptionCard'; // Bu component'in doğru çalıştığını varsayıyoruz

const SuggestGameSection = () => {
  const handleSuggestWithSupport = () => {
    console.log("Destekle & Öner tıklandı");
    // TODO: İlgili aksiyon
  };

  const handleSuggestWithCommunity = () => {
    console.log("Toplulukla Öner tıklandı");
    // TODO: İlgili aksiyon
  };

  return (
    <section className="suggest-game-section bg-suggest-section-bg py-16 md:py-24 relative overflow-hidden min-h-[550px] md:min-h-[500px] lg:min-h-0 lg:py-28"> {/* lg için min-height sıfırlanıp padding ayarlandı */}
      {/* Arka Plan Videosu ve Overlay */}
      <div className="absolute inset-0 z-[1] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto transform -translate-x-1/2 -translate-y-1/2 object-cover filter brightness-[.4]" // Parlaklık azaltıldı
        >
          <source src="/videos/your-main-background-video.webm" type="video/webm" />
          <source src="/videos/your-main-background-video.mp4" type="video/mp4" />
          Tarayıcınız video etiketini desteklemiyor.
        </video>
        <div className="absolute inset-0 bg-suggest-overlay-bg opacity-70"></div> {/* Hafif bir overlay daha */}
      </div>

      {/* İçerik Container'ı */}
      <div className="container mx-auto relative z-[2] px-4 md:px-6 lg:px-20 xl:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center"> {/* items-center EKLENDİ (dikeyde ortalama için) */}
          {/* Öneri Kartları (Sol Sütun - Masaüstü) */}
          {/* Bu sütun, diğerlerinin dikey hizalaması için referans olacak. */}
          <div className="lg:col-span-1 order-3 lg:order-1">
            <div className="suggest-options-stack flex flex-col gap-5 md:gap-6 w-full max-w-md mx-auto lg:mx-0 lg:max-w-none">
<SuggestOptionCard
                title="Destek Vererek Oyun Önerin"
                description="Bu türü seçersen oyunun çok yüksek ihtimalle kabul edilir."
                buttonText="Destekle & Öner"
                buttonIconSrc="/images/icon-donate-game.jpg"
                onButtonClick={handleSuggestWithSupport}
                isPrimaryAction={true}
              />
              <SuggestOptionCard
                title="Topluluk Gücüyle Önerin"
                description="Kullanıcılar bir oyuna belli bir istek sayısından sonra o oyunun dublajına başlayabiliriz."
                buttonText="Toplulukla Öner"
                buttonIconSrc="/images/icon-community-game.jpg"
                onButtonClick={handleSuggestWithCommunity}
                isPrimaryAction={false}
              />
              </div>
          </div>
          {/* Şartlar Metni (Orta Sütun - Masaüstü) */}
          {/* lg:self-center ile kendini dikeyde ortalayacak VEYA ana grid'in items-center'ı zaten bunu yapacak */}
          <div className="lg:col-span-1 order-2 lg:order-2 text-center"> 
            <p className="suggest-terms-text text-sm md:text-base text-suggest-terms-text">
              <Link href="#oyunIstekSartlari" className="text-suggest-terms-link hover:text-suggest-terms-link-hover border-b border-dotted border-current hover:border-solid">
                Oyun İstek Şartları
              </Link>
              'nı inceleyebilirsiniz.
            </p>
          </div>
          
          {/* Ana Başlık (Sağ Sütun - Masaüstü) */}
          {/* lg:self-center ile kendini dikeyde ortalayacak VEYA ana grid'in items-center'ı zaten bunu yapacak */}
          <div className="lg:col-span-1 order-1 lg:order-3 text-center">
            <h2 className="section-title text-3xl sm:text-4xl md:text-5xl font-bold text-suggest-main-title-text leading-tight text-shadow-suggest-title">
              Daha Fazla Oyun Mu İstiyorsun?
            </h2>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SuggestGameSection;