// src/components/home/TopProjectCard.tsx
"use client";
import Link from 'next/link';
import Image, { StaticImageData } from 'next/image';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { formatDate } from '@/lib/utils'; // Üst kısma import ekleyin

export interface TopProjectCardProps {
  slug: string;
  title: string;
  type: 'Oyun' | 'Anime';
  bannerUrl?: string | null;
  coverUrl?: string | null;
  date?: string | Date | null; // VEYA string | Date | null | undefined
  description?: string | null;
}

// Karakter sınırlama fonksiyonu
const truncateText = (text: string, limit: number) => {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + '...';
};

const TopProjectCard: React.FC<TopProjectCardProps> = ({
  slug,
  title,
  type,
  bannerUrl,
  coverUrl,
  date,
  description,
}) => {
  const itemTypePath = type.toLowerCase() === 'oyun' ? 'oyunlar' : 'animeler';
  const typeSpecificClass = type === 'Oyun' ? 'project-type-oyun bg-dublio-type-game' : 'project-type-anime bg-dublio-type-anime';
  const typeTextClass = 'text-white';

  const finalBannerUrl: string = getCloudinaryImageUrlOptimized(
    bannerUrl,
    { width: 400, height: 175, crop: 'fill' },
    'banner' // <<< Placeholder tipi BANNER olarak belirtildi
  );
  const rawCoverId = coverUrl; // veya displayData.coverUrl
console.log(`Component: ${title}, Raw Cover ID/Path:`, rawCoverId);
  const finalCoverUrl: string = getCloudinaryImageUrlOptimized(
  coverUrl,
  { width: 60, height: 60 }, // SADECE width ve height, crop/gravity yok
  'cover'
);
console.log(`Component: ${title}, Final Cover URL for Image:`, finalCoverUrl);

  return (
    <Link
      href={`/${itemTypePath}/${slug}`}
      className="group/card flex-1 min-w-0 rounded-lg text-white no-underline transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dublio-purple"
    >
      <div className="top-project-item bg-dublio-bg-card-1 rounded-lg flex flex-col overflow-hidden h-full relative">
        {/* Banner Alanı */}
        <div className="top-project-banner w-full aspect-[16/7] overflow-hidden relative bg-[#050308]">
          {/* Banner resmi */}
          <Image
  src={finalBannerUrl} // Cloudinary URL
  alt={`${title} Banner`}
  fill // Bu varsa sizes da olmalı
  className="object-cover transition-transform duration-300 ease-in-out group-hover/card:scale-[1.03]"
  unoptimized={!finalBannerUrl.startsWith('/')} // Sadece Cloudinary için unoptimized
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // ÖRNEK SIZES
  priority={true} // Eğer LCP ise
/>
          {/* Tür Etiketi - hover'da yukarı kayarak kaybolacak */}
          <span 
            className={`${typeSpecificClass} ${typeTextClass} absolute top-3 left-3 z-10 
                       text-[0.7em] font-semibold px-[8px] py-[3px] rounded-md uppercase 
                       tracking-[0.5px] leading-none
                       transition-all duration-300 ease-out
                       opacity-100 group-hover/card:opacity-0 group-hover/card:-translate-y-4`}
          >
            {type}
          </span>

          {/* Karartı efekti - Sürekli görünür, hover'da kaybolur */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent
                       opacity-100 group-hover/card:opacity-0 transition-all duration-300 ease-out"
            style={{
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.81) 0%, rgba(0, 0, 0, 0.12) 50%, rgba(0,0,0,0) 100%)'
            }}
          />
        </div>

        {/* Detaylar bölümü */}
        <div className="top-project-details absolute bottom-0 left-0 w-full p-[10px_12px] flex items-end gap-[10px] z-[4] 
                       transition-all duration-300 ease-out
                       opacity-100 group-hover/card:opacity-0 group-hover/card:translate-y-full pointer-events-none">
          <Image
  src={finalCoverUrl} // Üretilen URL
  alt={`${title} Kapak`}
  width={60}
  height={60}
            className="top-project-cover w-[60px] h-[60px] object-cover rounded-md shadow-[0_2px_5px_rgba(0,0,0,0.2)] flex-shrink-0"
            unoptimized={!finalCoverUrl.startsWith('/')}
/>
          
          <div className="top-project-text flex flex-col justify-end flex-grow overflow-hidden">
            <span className="project-title font-semibold text-dublio-text-primary text-base leading-tight mb-1"> {/* Boyutu küçülttüm, mb-1 yaptım */}
              {title}
            </span>
            {description && (
              <p className="project-description text-xs text-dublio-text-secondary/80 leading-snug mb-1 line-clamp-2">
                {truncateText(description, 50)} {/* 100 karakter ile sınırlandır */}
              </p>
            )}
            {date && (
              <span className="project-date text-[0.7rem] text-dublio-text-muted/70">
                {formatDate(date)} {/* date direkt kullanmak yerine formatDate ile formatlayın */}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TopProjectCard;