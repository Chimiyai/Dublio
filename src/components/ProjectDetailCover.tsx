// src/components/ProjectDetailCover.tsx (İYİLEŞTİRİLMİŞ VE DÜZELTİLMİŞ VERSİYON)
'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { PhotoIcon, PlayCircleIcon, PauseCircleIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import ReactPlayer from 'react-player/lazy';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

interface ProjectDataForCover {
    title: string;
    bannerImagePublicId: string | null;
    trailerUrl?: string | null;
}

interface ProjectDetailCoverProps {
    project: ProjectDataForCover;
    playTrigger: boolean;
    onVideoStateChange: (isPlaying: boolean, hasError?: boolean) => void;
}

export default function ProjectDetailCover({ project, playTrigger, onVideoStateChange }: ProjectDetailCoverProps) {
  const { title, bannerImagePublicId, trailerUrl } = project;

  const [isMuted, setIsMuted] = useState(false);
  const [showCustomControls, setShowCustomControls] = useState(false);
  const [playerState, setPlayerState] = useState<'banner' | 'playing' | 'error'>('banner');
  const playerRef = useRef<ReactPlayer>(null);

  // Dışarıdan gelen `playTrigger`'ı izle
  useEffect(() => {
    if (playTrigger && trailerUrl) {
      setPlayerState('playing');
      setIsMuted(false); // Oynat deyince sesi aç
      onVideoStateChange(true, false);
    }
  }, [playTrigger, trailerUrl]);

  const handlePauseFromInternalControls = () => {
    setPlayerState('banner');
    onVideoStateChange(false, false); // Durdu, hata yok
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const bannerDisplayUrl = bannerImagePublicId
    ? getCloudinaryImageUrlOptimized(
        bannerImagePublicId,
        { width: 1920, height: 1080, crop: 'fill', gravity: 'auto', quality: 'auto', format: 'auto' },
        'banner'
      )
    : null; // Eğer banner yoksa null yap

  if (!bannerDisplayUrl && !trailerUrl) {
    return (
      <div className="relative w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 rounded-lg">
        <PhotoIcon className="w-24 h-24 opacity-50" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full bg-black rounded-lg shadow-lg overflow-hidden group/cover"
      onMouseEnter={() => { if (playerState === 'playing') setShowCustomControls(true); }}
      onMouseLeave={() => setShowCustomControls(false)}
    >
      {/* 1. Katman: Banner Resmi (varsa) */}
      {bannerDisplayUrl && (
        <NextImage
          src={bannerDisplayUrl}
          alt={`${title} Banner`}
          fill
          className={cn(
            "absolute inset-0 object-cover transition-opacity duration-300 ease-in-out rounded-lg z-10",
            playerState === 'playing' && "opacity-30" // Video oynarken arkada hafifçe görünsün
          )}
          priority={playerState !== 'playing'}
        />
      )}

      {/* 2. Katman: ReactPlayer (sadece trailer varsa render edilir) */}
      {trailerUrl && (
        <div className={cn(
          "absolute inset-0 w-full h-full z-20", // Banner'ın üzerinde
          playerState === 'playing' ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <ReactPlayer
            ref={playerRef}
            url={trailerUrl}
            playing={playerState === 'playing'}
            loop={false}
            muted={isMuted}
            width="100%"
            height="100%"
            controls={false}
            playsinline={true}
            className="w-full h-full bg-black"
            config={{
                youtube: { playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, fs: 0, disablekb: 1 } }
            }}
            onPlay={() => {
              if (playerState !== 'playing') setPlayerState('playing');
              onVideoStateChange(true, false);
            }}
            onPause={handlePauseFromInternalControls}
            onEnded={handlePauseFromInternalControls}
            onError={e => {
              console.error('ReactPlayer Hatası:', e);
              setPlayerState('error');
              onVideoStateChange(false, true);
            }}
          />
        </div>
      )}
      
      {/* 3. Katman: Şeffaf Overlay (video oynarken tıklamaları yutmak için) */}
      {playerState === 'playing' && (
        <div className="absolute inset-0 w-full h-full z-30" />
      )}

      {/* 4. Katman: Özel Kontroller (en üstte) */}
      <div className="absolute inset-0 w-full h-full z-40 pointer-events-none"> {/* Bu sarmalayıcı tıklamaları almaz */}
        {playerState === 'playing' && (
            <div className={cn(
                "absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center space-x-2 transition-opacity duration-300 pointer-events-auto", // Ama içindekiler alır
                "opacity-75 group-hover/cover:opacity-100" // Her zaman görünür, hover'da netleşir
            )}>
                <button onClick={handlePauseFromInternalControls} className="p-1.5 sm:p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white" aria-label="Durdur">
                    <PauseCircleIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
                <button onClick={handleToggleMute} className="p-1.5 sm:p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white" aria-label={isMuted ? "Sesi Aç" : "Sesi Kapat"}>
                    {isMuted ? <SpeakerXMarkIcon className="w-6 h-6 sm:w-7 sm:h-7" /> : <SpeakerWaveIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
                </button>
            </div>
        )}

        {/* Ortadaki Oynat Butonu */}
        {playerState === 'banner' && trailerUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <button
              onClick={() => {
                setPlayerState('playing');
                setIsMuted(false);
                onVideoStateChange(true, false);
              }}
              className="p-4 rounded-full hover:bg-black/30 transition-colors focus:outline-none group"
              aria-label={`Play ${title} trailer`}
            >
              <PlayCircleIcon className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white text-opacity-80 group-hover:text-opacity-100 group-hover:scale-110 transition-all duration-200 ease-in-out filter drop-shadow-lg" />
            </button>
          </div>
        )}
      </div>

      {/* Hata Mesajı Katmanı (en en üstte) */}
      {playerState === 'error' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 text-center">
              <p className="text-red-500 text-lg font-semibold">Video Yüklenemedi</p>
              <button
                  onClick={handlePauseFromInternalControls} // banner durumuna dönmek için
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                  Kapat
              </button>
          </div>
      )}
    </div>
  );
}