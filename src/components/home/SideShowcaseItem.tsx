// src/components/home/SideShowcaseItem.tsx
"use client";
import React from 'react';
import Image, { StaticImageData } from 'next/image';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

export interface SideShowcaseItemProps {
  cardTitle: string;
  type: string;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  isActive: boolean;
  onClick: () => void;
  // releaseDate?: string | Date | null; // Eğer buraya da tarih eklemek istersen
}

const SideShowcaseItem: React.FC<SideShowcaseItemProps> = ({
  cardTitle,
  type,
  coverUrl,
  bannerUrl,
  isActive,
  onClick,
  // releaseDate // Eğer prop olarak alırsan
}) => {
  const typeNormalized = type.toLowerCase();
  const typeBgClass = typeNormalized === 'oyun' ? 'bg-dublio-type-game' : typeNormalized === 'anime' ? 'bg-dublio-type-anime' : 'bg-gray-500';

  const finalCoverUrl: string | StaticImageData = getCloudinaryImageUrlOptimized(coverUrl, { width: 65, height: 65, crop: 'thumb' }, 'cover');
  const finalBannerUrl: string | StaticImageData = getCloudinaryImageUrlOptimized(bannerUrl, { width: 196, height: 65, crop: 'fill' }, 'banner');

  return (
    <button
      onClick={onClick}
      className={cn(
        "side-list-item-link block w-full rounded-lg relative overflow-hidden bg-dublio-bg-card-2 group h-full",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-xl",
        isActive && "ring-2 ring-dublio-purple shadow-lg z-10"
      )}
      style={{ minHeight: '65px' }}
    >
      <div className={cn(
          "absolute -inset-2 opacity-0 transition-opacity duration-300 ease-out pointer-events-none rounded-xl",
          "bg-gradient-radial from-dublio-purple/20 via-dublio-purple/5 to-transparent",
          isActive ? "opacity-60 scale-105" : "group-hover:opacity-40"
      )}></div>
      
      <div className="side-list-item flex items-center w-full p-[8px] relative z-[1] h-full z">
        <Image
          src={finalCoverUrl}
          alt={`${cardTitle} Kapak`}
          width={65}
          height={65}
          className="side-item-cover w-[65px] h-[65px] object-cover rounded-md mr-[10px] flex-shrink-0 border border-white/10 z-[2] transition-transform duration-300 ease-out group-hover:scale-110"
          unoptimized={typeof finalCoverUrl === 'string' && finalCoverUrl.startsWith('/images/')}
        />
        <div className="side-item-main-content flex-grow relative z-[2] flex flex-col justify-center overflow-hidden text-left">
          <span className={`${typeBgClass} text-white inline-block self-start text-[0.65em] font-semibold rounded px-[6px] py-[2px] leading-none mb-0.5`}>
            {type}
          </span>
          <span className="side-item-title text-dublio-text-secondary text-[0.9em] font-medium truncate text-shadow-sm leading-tight" title={cardTitle}>
            {cardTitle}
          </span>
          {/* Eğer buraya tarih eklenecekse: */}
          {/* {releaseDate && <span className="text-xs text-gray-400">{formatDate(releaseDate, { month: 'short', day: 'numeric'})}</span>} */}
        </div>
        <div className="side-item-banner-background absolute top-0 right-0 w-[100%] h-full bg-cover bg-center z-0 rounded-r-lg overflow-hidden">
          <Image
            src={finalBannerUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
            unoptimized={typeof finalBannerUrl === 'string' && finalBannerUrl.startsWith('/images/')}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(16,12,28,0) 5%, rgba(16,12,28,0.4) 35%, #100C1C 85%)' }}></div>
        </div>
      </div>
    </button>
  );
};
export default SideShowcaseItem;