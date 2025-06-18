// src/components/ui/PopularContentCard.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { cn } from '@/lib/utils'; // cn fonksiyonunu import etmeyi unutmayın
// İkonları import etmeyi unutma (HandThumbUpIcon, vb.)
import { PhotoIcon } from '@heroicons/react/24/solid';
import { HandThumbUpIcon, HandThumbDownIcon, HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';


export interface PopularContentCardProps {
  slug: string;
  title: string;
  type: 'Oyun' | 'Anime'; // Bu zaten doğru
  bannerImageUrl: string | null | undefined; // string | null yeterli olabilir, undefined'ı ?? ile hallederiz
  coverImageUrl: string | null | undefined;  // string | null yeterli olabilir
  description: string | null;
  date: string | null;
  likes: number;
  dislikes: number;    // Zorunlu mu, opsiyonel mi?
  favorites: number;   // Zorunlu mu, opsiyonel mi?
  itemTypePath: 'oyunlar' | 'animeler' | 'projeler'; // Bu da doğru
  price?: number | null;
  currency?: string | null;
  onClick?: () => void;
}


const PopularContentCard: React.FC<PopularContentCardProps> = ({
  slug,
  title,
  type,
  bannerImageUrl,
  coverImageUrl, // SOLDAKİ KÜÇÜK KAPAK RESMİ İÇİN ID
  description,
  date,
  likes,
  dislikes,
  favorites,
  itemTypePath,
  onClick,
}) => {
  console.log(`KART RENDER: ${title}`, { likes, favorites });
  const bannerTypeTagClass = type.toLowerCase() === 'oyun' 
    ? 'bg-[#2A9D8F]' // Banner üzerindeki etiket rengi
    : 'bg-[#F4A261]';

  // Tür belirteç çizgisi için renk class'ı (KÜÇÜK KAPAK RESMİNİN ALTINDAKİ)
  const coverTypeIndicatorLineClass = type.toLowerCase() === 'oyun'
    ? 'bg-[#2A9D8F]' // Oyun için çizgi rengi
    : 'bg-[#E76F51]'; // Anime için çizgi rengi

  const formatStatCount = (count: number) => {
    if (count > 9999) return (count / 1000).toFixed(0) + 'K';
    if (count > 999) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };
  
  const finalBannerSrc = getCloudinaryImageUrlOptimized(
    bannerImageUrl,
    { width: 400, height: 180, crop: 'fill', quality: 'auto', format: 'auto' }, // Yüksekliği biraz azalttım (16/7 gibi)
    'banner'
  );
  const coverImageSize = 126;
  const finalCoverSrc = getCloudinaryImageUrlOptimized(
    coverImageUrl,
    { width: coverImageSize, height: coverImageSize, crop: 'fill', gravity: 'face', quality: 'auto', format: 'auto' },
    'cover'
  );

  return (
    <Link
      href={`/${itemTypePath}/${slug}`}
      onClick={onClick}
      className="popular-card-link group flex flex-col bg-popular-card-bg rounded-xl overflow-hidden shadow-popular-card hover:shadow-popular-card-hover transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] h-full"
    >
      {/* Banner Bölümü (En Üstteki Büyük Resim) */}
      {finalBannerSrc && ( // Sadece bannerImageUrl varsa göster
        <div className="popular-card-banner w-full aspect-[16/7] sm:aspect-[16/6] relative overflow-hidden">
          <Image 
            src={finalBannerSrc}
            alt={`${title} Banner`} 
            fill 
            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
        </div>
      )}

      {/* İçerik Bölümü */}
      <div className="popular-card-content p-3 sm:p-4 flex flex-col flex-grow"> {/* Padding ayarlandı */}
        <div className="flex gap-3 items-start mb-3"> {/* Gap ayarlandı */}
          {/* Sol Taraftaki Küçük Kapak Resmi ve Altındaki Çizgi */}
          <div className="flex-shrink-0">
            {/* KÜÇÜK KAPAK RESMİ İÇİN YENİ CLASS'LAR */}
            <div 
              className="popular-card-cover w-14 h-14 object-cover rounded-md overflow-hidden border border-white/10 relative bg-gray-700" // w-14 h-14 (56px), rounded-md
              // style={{ width: `${coverImageSize}px`, height: `${coverImageSize}px` }} // Alternatif olarak inline stil
            >
              {coverImageUrl || finalCoverSrc.startsWith('/') ? ( // Placeholder veya gerçek resim varsa
                <Image 
                  src={finalCoverSrc}
                  alt={`${title} Kapak`} 
                  fill
                  className="object-cover"
                  sizes={`${coverImageSize}px`} // Image sizes prop'u güncellendi
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="w-8 h-8 text-gray-500" /> {/* Placeholder ikonu */}
                </div>
              )}
            </div>
            {/* TÜR BELİRTEÇ ÇİZGİSİ */}
            <div className={cn(
                "w-full h-0.5 mt-1.5 rounded", // h-0.5 (2px) daha ince bir çizgi için
                coverTypeIndicatorLineClass
            )}></div>
          </div>

          {/* Sağ Taraftaki Bilgi Bloğu */}
          <div className="popular-card-info flex-grow min-w-0">
            <h3 className="popular-card-title text-sm md:text-base font-semibold text-popular-card-text mb-0.5 leading-tight group-hover:text-prestij-purple transition-colors">
              {title}
            </h3>
            {description && (
                <p className="popular-card-description text-xs text-popular-card-description-text mb-1 leading-snug line-clamp-2"> {/* mb ayarlandı */}
                {description}
                </p>
            )}
            <span className="popular-card-date text-2xs text-popular-card-date-text block">
                {date ? `Yayın: ${date}` : 'Tarih Bilinmiyor'}
            </span>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="popular-card-stats mt-auto pt-2.5 px-0 pb-1 border-t border-popular-card-border-top flex justify-around items-center">
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
      </div>
    </Link>
  );
};

export default PopularContentCard;

