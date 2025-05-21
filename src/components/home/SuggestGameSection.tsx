// src/components/home/SuggestGameSection.tsx
'use client';

import Image from "next/image";
import Link from 'next/link';

interface SuggestGameSectionProps {
  videoSrc?: string; // Opsiyonel, eğer video yoksa farklı bir arkaplan gösterilebilir
  // Diğer proplar eklenebilir: title, button texts etc.
}

export default function SuggestGameSection({ videoSrc }: SuggestGameSectionProps) {
  return (
    <section className="suggest-game-section feather-video-layout relative bg-bg-primary-dark py-20 sm:py-28 md:py-32 lg:py-40 min-h-[500px] sm:min-h-[550px] overflow-hidden flex flex-col justify-center items-center">
      {videoSrc && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="feather-video-bg absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto transform -translate-x-1/2 -translate-y-1/2 z-[1] object-cover
                     brightness-75" // Parlaklığı azaltmak için
          // Feather efekti için mask, Tailwind ile zor, inline style veya CSS'te
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
          }}
        >
          <source src={`${videoSrc}.mp4`} type="video/mp4" />
          Tarayıcınız video etiketini desteklemiyor.
        </video>
      )}
      {/* Overlay, eğer video yoksa veya ek bir karartma için */}
       <div className="feather-video-overlay absolute inset-0 bg-bg-primary-dark/70 z-[2]"></div>


      <div className="container suggest-columns-container relative z-[3] flex flex-col lg:flex-row items-center justify-center gap-8 text-center w-full">
        <div className="suggest-left-cards-column flex-shrink-0 lg:flex-1 lg:max-w-md flex flex-col items-center gap-5 text-left order-2 lg:order-1 w-full px-4 sm:px-0">
          <div className="suggest-option-card bg-secondary-dark/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl text-center w-full">
            <h3 className="suggest-option-title text-xl font-semibold text-gray-50 mb-4">Destek Vererek Oyun Önerin</h3>
            <button className="btn btn-primary btn-suggest-action bg-text-brand-purple text-white py-2.5 px-5 text-sm rounded-md hover:bg-purple-500 flex items-center justify-center gap-2 mx-auto mb-3">
              <Image src="/images/icon-donate-game.jpg" alt="Destek" width={20} height={20} className="btn-icon" />
              Destekle & Öner
            </button>
            <p className="suggest-option-description text-xs text-gray-400">Bu türü seçersen oyunun çok yüksek ihtimalle kabul edilir.</p>
          </div>
          <div className="suggest-option-card bg-secondary-dark/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50 shadow-xl text-center w-full">
            <h3 className="suggest-option-title text-xl font-semibold text-gray-50 mb-4">Topluluk Gücüyle Önerin</h3>
            <button className="btn btn-secondary btn-suggest-action bg-gray-700/70 text-gray-200 border border-gray-600 py-2.5 px-5 text-sm rounded-md hover:bg-gray-600 flex items-center justify-center gap-2 mx-auto mb-3">
              <Image src="/images/icon-community-game.jpg" alt="Topluluk" width={20} height={20} className="btn-icon" />
              Toplulukla Öner
            </button>
            <p className="suggest-option-description text-xs text-gray-400">Kullanıcılar bir oyuna belli bir istek sayısından sonra o oyunun dublajına başlayabiliriz.</p>
          </div>
        </div>

        <div className="suggest-center-terms-column order-1 lg:order-2 my-4 lg:my-0 lg:mx-6">
            <p className="suggest-terms-text text-sm text-gray-300">
                <Link href="#oyunIstekSartlari" className="text-text-brand-purple hover:underline">Oyun İstek Şartları</Link>'nı inceleyebilirsiniz.
            </p>
        </div>

        <div className="suggest-right-title-column lg:flex-1 order-0 lg:order-3 w-full lg:w-auto px-4 sm:px-0">
            <h2 className="section-title suggest-main-title-right text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight text-center lg:text-right">Daha Fazla Oyun Mu İstiyorsun?</h2>
        </div>
      </div>
      {/* <div className="section-divider bottom-divider absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 max-w-screen-lg h-px bg-gray-700/50 opacity-50"></div> */}
    </section>
  );
}