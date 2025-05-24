// src/components/ui/SliderCard.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';

interface SliderCardProps {
  slug: string; // veya id: string | number;
  title: string;
  type: 'Oyun' | 'Anime'; // Türü belirlemek için
  coverImageUrl: string;
  bannerImageUrl: string;
  description?: string; // Opsiyonel
  itemTypePath: 'oyunlar' | 'animeler'; // Link için /oyunlar/[slug] veya /animeler/[slug]
}

const SliderCard: React.FC<SliderCardProps> = ({
  slug,
  title,
  type,
  coverImageUrl,
  bannerImageUrl,
  description,
  itemTypePath,
}) => {
  // Tür etiketini ve rengini burada belirleyebiliriz, ama orijinal CSS'te kartın içinde değildi, banner üzerindeydi.
  // Hover'da kapak ve yazıların görünmesi orijinal CSS'de vardı.

  return (
    <Link
      href={`/${itemTypePath}/${slug}`}
      className="slider-card-link group block w-full h-full rounded-lg overflow-hidden relative shadow-md hover:shadow-xl transition-all duration-250 ease-out hover:-translate-y-1 hover:scale-[1.02]"
    >
      <div className="slider-card bg-slider-card-bg rounded-lg flex flex-col w-full h-full relative cursor-pointer overflow-hidden">
        {/* Banner Alanı */}
        <div
          className="slider-card-banner w-full aspect-16/7 bg-cover bg-center relative flex items-start p-2 transition-transform duration-300 ease-in-out group-hover:scale-105"
          style={{ backgroundImage: `url(${bannerImageUrl})` }}
        >
          {/* Banner üzerine tür etiketi (opsiyonel, orijinal CSS'de yoktu ama isterseniz eklenebilir) */}
          {/* <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold text-white ${type === 'Oyun' ? 'bg-project-type-oyun' : 'bg-project-type-anime'}`}>
            {type}
          </span> */}
          <div className="banner-top-to-bottom-fade absolute inset-0 bg-slider-card-banner-fade z-[2]"></div>
        </div>

        {/* Hover'da Görünen İçerik (Kapak ve Yazılar) */}
        <div className="slider-card-content-on-banner absolute bottom-0 left-0 w-full p-2.5 flex items-end gap-2 z-[3] 
                        opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 
                        transition-all duration-250 ease-out delay-100">
          <Image
            src={coverImageUrl}
            alt={`${title} Kapak`}
            width={40} // Orijinal: 40px
            height={56} // Orijinal: 56px
            className="slider-card-cover w-[40px] h-[56px] object-cover rounded-sm flex-shrink-0 border border-white/10 shadow-sm 
                       opacity-0 transform scale-90 -translate-x-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0
                       transition-all duration-250 ease-out delay-150"
          />
          <div className="slider-card-info flex-grow min-w-0 text-white 
                          opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                          transition-all duration-250 ease-out delay-200">
            <h3 className="slider-card-title text-sm font-semibold text-slider-card-title mb-0.5 truncate leading-tight text-shadow-sm">{title}</h3>
            {description && (
              <p className="slider-card-description text-xs text-slider-card-description line-clamp-2 leading-snug text-shadow-sm">{description}</p>
            )}
          </div>
        </div>
        
        {/* Alttan Gelen Karartı (Orijinal CSS'deki ::after) */}
        <div className="absolute bottom-0 left-0 w-full h-3/5 bg-slider-card-content-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-[2] rounded-b-lg pointer-events-none"></div>

      </div>
    </Link>
  );
};

export default SliderCard;