// src/components/ui/PopularContentCard.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary'; // Import et

interface PopularContentCardProps {
  slug: string;
  title: string;
  type: 'Oyun' | 'Anime';
  bannerImageUrl: string | null | undefined; // API'den gelen bannerImagePublicId veya placeholder yolu
  coverImageUrl: string | null | undefined;  // API'den gelen coverImagePublicId veya placeholder yolu
  description: string;
  date: string;
  likes: number;
  dislikes: number;
  favorites: number;
  itemTypePath: 'oyunlar' | 'animeler';
}

const PopularContentCard: React.FC<PopularContentCardProps> = ({
  slug,
  title,
  type,
  bannerImageUrl, // Bu prop artık Cloudinary ID'si veya placeholder yolu alacak
  coverImageUrl,  // Bu prop artık Cloudinary ID'si veya placeholder yolu alacak
  description,
  date,
  likes,
  dislikes,
  favorites,
  itemTypePath,
}) => {
  // Rengi burada belirliyoruz
  const typeClass = type.toLowerCase() === 'oyun' 
    ? 'bg-project-type-oyun' // Veya bg-[#2A9D8F]
    : 'bg-project-type-anime';

  const formatStatCount = (count: number) => {
    if (count > 9999) return (count / 1000).toFixed(0) + 'K';
    if (count > 999) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  // Cloudinary ID'lerini veya placeholder yollarını URL'ye çevir
  const finalBannerSrc = getCloudinaryImageUrlOptimized(
    bannerImageUrl,
    { width: 400, height: 225, crop: 'fill', quality: 'auto', format: 'auto' },
    'banner' // Eğer bannerImageUrl null/undefined ise bu placeholder kullanılacak
  );
  const finalCoverSrc = getCloudinaryImageUrlOptimized(
    coverImageUrl,
    { width: 60, height: 60, crop: 'thumb', gravity: 'face', quality: 'auto', format: 'auto' },
    'cover'  // Eğer coverImageUrl null/undefined ise bu placeholder kullanılacak
  );

  return (
    <Link
      href={`/${itemTypePath}/${slug}`}
      className="popular-card-link group flex flex-col bg-popular-card-bg rounded-xl overflow-hidden shadow-popular-card hover:shadow-popular-card-hover transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] h-full"
    >
      <div className="popular-card-banner w-full aspect-16/8 relative overflow-hidden">
        <Image 
          src={finalBannerSrc} // DÖNÜŞTÜRÜLMÜŞ URL KULLANILDI
          alt={`${title} Banner`} 
          fill 
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Responsive sizes
          priority={false} // İlk yüklenenler değilse false olabilir
        />
        <span className={`banner-on-type-popular absolute top-2.5 left-2.5 ${typeClass} text-white text-2xs font-semibold rounded uppercase tracking-wider px-2 py-0.5 leading-none z-10`}>
          {type}
        </span>
      </div>

      <div className="popular-card-content p-3.5 flex gap-3 items-start">
        <Image 
          src={finalCoverSrc} // DÖNÜŞTÜRÜLMÜŞ URL KULLANILDI
          alt={`${title} Kapak`} 
          width={60} 
          height={60} 
          className="popular-card-cover w-[60px] h-[60px] object-cover rounded-md flex-shrink-0 border border-white/10" 
        />
        <div className="popular-card-info flex-grow min-w-0">
          <h3 className="popular-card-title text-base font-semibold text-popular-card-text mb-1.5 leading-tight group-hover:text-prestij-purple transition-colors">
            {title}
          </h3>
          <p className="popular-card-description text-xs text-popular-card-description-text mb-2 leading-snug line-clamp-2">
            {description}
          </p>
          <span className="popular-card-date text-2xs text-popular-card-date-text block">
            Eklendi: {date}
          </span>
        </div>
      </div>

      <div className="popular-card-stats mt-auto px-3.5 py-2.5 border-t border-popular-card-border-top flex justify-around items-center">
        <button 
          onClick={(e) => { e.preventDefault(); console.log('Like tıklandı:', slug); }}
          className="stat-button flex items-center gap-1 text-popular-stat-button-text hover:text-popular-stat-button-hover-text hover:bg-popular-stat-button-hover-bg p-1 rounded transition-colors text-xs"
          aria-label={`Beğen: ${title}`}
        >
          <i className="fas fa-thumbs-up text-sm"></i>
          <span className="stat-count font-medium">{formatStatCount(likes)}</span>
        </button>
        
        <button 
          onClick={(e) => { e.preventDefault(); console.log('Dislike tıklandı:', slug); }}
          className="stat-button flex items-center gap-1 text-popular-stat-button-text hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors text-xs"
          aria-label={`Beğenme: ${title}`}
        >
          <i className="fas fa-thumbs-down text-sm"></i>
        </button>

        <button 
          onClick={(e) => { e.preventDefault(); console.log('Favorilere ekle tıklandı:', slug); }}
          className="stat-button flex items-center gap-1 text-popular-stat-button-text hover:text-popular-stat-button-hover-text hover:bg-popular-stat-button-hover-bg p-1 rounded transition-colors text-xs"
          aria-label={`Favorilere ekle: ${title}`}
        >
          <i className="fas fa-heart text-sm"></i>
          <span className="stat-count font-medium">{formatStatCount(favorites)}</span>
        </button>
      </div>
    </Link>
  );
};

export default PopularContentCard;