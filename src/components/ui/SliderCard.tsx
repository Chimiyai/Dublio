// src/components/ui/SliderCard.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryInfo } from '@/types/showcase';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary'; // Import et
import { cn } from '@/lib/utils';

export interface SliderCardProps {
  slug: string;
  title: string;
  categories: CategoryInfo[];
  coverImageUrl?: string | null | undefined; // API'den gelen coverImagePublicId veya placeholder
  bannerImageUrl?: string | null | undefined;// API'den gelen bannerImagePublicId veya placeholder
  description?: string;
  itemTypePath: string;
}

const SliderCard: React.FC<SliderCardProps> = ({
  slug,
  title,
  categories,
  coverImageUrl,  // Bu prop artık Cloudinary ID'si veya placeholder yolu alacak
  bannerImageUrl, // Bu prop artık Cloudinary ID'si veya placeholder yolu alacak
  description,
  itemTypePath,
}) => {
  const finalBannerSrc = getCloudinaryImageUrlOptimized(
    bannerImageUrl,
    { width: 320, height: 140, crop: 'fill', quality: 'auto', format: 'auto' },
    'banner'
  );
  const finalCoverSrc = getCloudinaryImageUrlOptimized(
    coverImageUrl,
    { width: 40, height: 56, crop: 'thumb', gravity: 'face', quality: 'auto', format: 'auto' },
    'cover'
  );

  return (
    <Link
      href={`/${itemTypePath}/${slug}`}
      className={cn(
        "slider-card-link group/slidecard block w-full h-full text-white no-underline rounded-lg overflow-hidden relative",
        "transition-transform duration-250 ease-out",
        "hover:-translate-y-[5px] hover:scale-[1.02] hover:shadow-[0_6px_18px_rgba(0,0,0,0.25)] hover:z-10"
      )}
    >
      {/* Hover'da radyal parlama efekti */}
      <div
        className="absolute -top-[15%] -left-[15%] w-[130%] h-[130%] bg-radial-gradient-purple opacity-0 
                   transition-opacity duration-300 ease-out group-hover/slidecard:opacity-100 
                   transform scale-[0.85] group-hover/slidecard:scale-100 pointer-events-none rounded-inherit z-0"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, rgba(139, 78, 255, 0.15) 0%, transparent 60%)'
        }}
      />

      <div
        className={cn(
          "slider-card bg-prestij-bg-card-2 rounded-lg flex flex-col w-full h-full relative cursor-pointer overflow-hidden"
        )}
      >
        <div
          className="slider-card-banner w-full aspect-[16/7] relative flex items-start p-2 box-border 
                     transition-transform duration-300 ease-in-out group-hover/slidecard:scale-[1.03] overflow-hidden z-[1]"
        >
          <Image
            src={finalBannerSrc} // DÖNÜŞTÜRÜLMÜŞ URL
            alt={`${title} Banner`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw" // Responsive sizes
          />
        </div>
<div
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{ background: 'linear-gradient(to bottom, rgba(16, 12, 28, 0.7) 0%, rgba(16, 12, 28, 0.3) 50%, transparent 100%)' }}
          />
        {/* Karartı efekti - Pozisyon değiştirildi ve z-index düzenlendi */}
        <div 
          className="absolute bottom-0 left-0 w-full h-3/5 z-[2] pointer-events-none rounded-b-lg
                     opacity-0 group-hover/slidecard:opacity-70 
                     transition-all duration-300 ease-in-out"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)'
          }}
        />

        {/* İçerik alanı - z-index karartının üzerine çıkarıldı */}
        <div className="slider-card-content-on-banner absolute bottom-0 left-0 w-full p-2.5 box-border 
                        flex items-end gap-2 z-[3] 
                        opacity-0 transform translate-y-[10px] 
                        transition-all duration-250 ease-out delay-100 
                        group-hover/slidecard:opacity-100 group-hover/slidecard:translate-y-0">
          {/* Kapak Resmi - boyutlar kare olarak güncellendi */}
          <Image
            src={finalCoverSrc} // DÖNÜŞTÜRÜLMÜŞ URL
            alt={`${title} Kapak`}
            width={40}
            height={56}
            className="slider-card-cover w-[40px] h-[56px] object-cover rounded flex-shrink-0 
                       border border-white/10 shadow-md
                       opacity-0 transform scale-[0.85] -translate-x-2 
                       transition-all duration-250 ease-out delay-150 group-hover/slidecard:opacity-100 group-hover/slidecard:scale-100 group-hover/slidecard:translate-x-0"
          />
          {/* Bilgi Alanı */}
          {/* Orijinal CSS: .slider-card-info */}
          <div
            className="slider-card-info flex-grow min-w-0 text-gray-200 
                       opacity-0 transform translate-y-2
                       transition-all duration-250 ease-out delay-200 group-hover/slidecard:opacity-100 group-hover/slidecard:translate-y-0"
          >
            <h3 className="slider-card-title text-[0.9em] sm:text-[0.95em] font-semibold text-white mb-0.5 leading-tight truncate text-shadow-sm">
              {title}
            </h3>
            {description && (
              <p className="slider-card-description text-[0.75em] sm:text-[0.78em] leading-snug text-gray-300/80 line-clamp-2 text-shadow-xs">
                {description}
              </p>
            )}
             {categories && categories.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {categories.slice(0, 2).map(cat => (
                  <span key={cat.slug} className={`text-[0.65em] px-1.5 py-0.5 rounded-sm ${cat.slug === 'oyun' || cat.name.toLowerCase() === 'oyun' ? 'bg-prestij-type-game' : 'bg-prestij-type-anime'} text-white opacity-80`}>
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alttan çıkan karartı efekti (Hover'da) */}
        {/* Orijinal CSS: .slider-card::after */}
        <div
          className="absolute bottom-0 left-0 w-full h-3/5
                     bg-gradient-to-t from-black via-black/80 to-transparent
                     opacity-0 transition-opacity duration-300 ease-in-out 
                     group-hover/slidecard:opacity-100 z-[2] pointer-events-none rounded-b-lg"
        />
      </div>
    </Link>
  );
};

export default SliderCard;