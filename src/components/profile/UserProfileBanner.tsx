// src/components/profile/UserProfileBanner.tsx (Yeni Dosya)
"use client";

import Image from 'next/image';
import { PhotoIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'; // EyeIcon eklendi
import { useState } from 'react';
import Link from 'next/link';

interface UserProfileBannerProps {
  bannerUrl: string; // getCloudinaryImageUrlOptimized'dan gelen tam URL
  username: string;
  isOwnProfile: boolean; // Raporlama menüsü için
}

const UserProfileBanner: React.FC<UserProfileBannerProps> = ({
  bannerUrl,
  username,
  isOwnProfile,
}) => {
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);

  return (
    <div className="banner-container w-full h-[60vh] sm:h-[65vh] md:h-[70vh] bg-gray-800 relative">
      {bannerUrl && !bannerUrl.endsWith('placeholder-banner.jpg') ? ( // Placeholder değilse göster
        <Image
          src={bannerUrl}
          alt={`${username} banner resmi`}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-800/40 via-indigo-800/40 to-pink-800/40 flex items-center justify-center">
          <PhotoIcon className="w-24 h-24 text-gray-500/60" />
        </div>
      )}
      {/* Alttan yukarı doğru solan gradyan (z-index'i ayarlanacak) */}
      <div 
        className="absolute inset-x-0 bottom-0 h-3/4 sm:h-2/3 md:h-3/5 z-[5] pointer-events-none" // z-index eklendi
        style={{
          background: 'linear-gradient(to top, rgba(16, 16, 20, 1) 0%, rgba(16, 16, 20, 0.8) 25%, transparent 100%)'
        }}
      />

      {/* Sağ Üst: Raporlama Menüsü (Sadece başkasının profilindeyken) */}
      {!isOwnProfile && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <div className="relative">
            <button
              onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
              className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors"
              aria-label="Daha fazla seçenek"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isReportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20">
                <button
                  onClick={() => { console.log('Kullanıcıyı Raporla:', username); setIsReportMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  Kullanıcıyı Raporla
                </button>
                <button
                  onClick={() => { console.log('Kullanıcıyı Engelle:', username); setIsReportMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-700/50 hover:text-white"
                >
                  Kullanıcıyı Engelle
                </button>
                {/* Başka seçenekler eklenebilir */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileBanner;