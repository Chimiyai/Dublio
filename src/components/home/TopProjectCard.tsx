// src/components/home/TopProjectCard.tsx
"use client";
import Image from 'next/image';
import Link from 'next/link';

interface TopProjectCardProps {
  type: 'Oyun' | 'Anime';
  title: string;
  date: string;
  bannerUrl: string;
  coverUrl: string;
  slug: string;
}

const TopProjectCard: React.FC<TopProjectCardProps> = ({ type, title, date, bannerUrl, coverUrl, slug }) => {
  const typeColor = type === 'Oyun' ? 'bg-project-type-oyun' : 'bg-project-type-anime';

  return (
    <Link href={`/projeler/${slug}`} className="top-project-link block flex-1 min-w-0 rounded-lg overflow-hidden shadow-hero-top-project hover:shadow-hero-top-project-hover transition-all duration-300 ease-out group relative hover:-translate-y-1.5 hover:scale-[1.02] focus-visible:outline-prestij-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
      <div className="top-project-item bg-hero-top-card-bg rounded-lg flex flex-col h-full">
        <div className="top-project-banner aspect-16/7 relative overflow-hidden z-[1] bg-hero-top-card-banner-bg">
          <div className="banner-image-wrapper absolute inset-0 z-[2] overflow-hidden">
            <Image src={bannerUrl} alt={`${title} Banner`} fill className="object-cover transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105" />
          </div>
          {/* Glow effect için: CSS'de background-image ile yapılabilir veya ek bir Image */}
          <div
            className="banner-glow-effect absolute inset-0 bg-cover bg-center filter blur-md brightness-110 saturate-125 opacity-0 transform scale-115 transition-opacity duration-450 ease-out group-hover:opacity-65 group-hover:scale-105 z-[1]"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          ></div>
        </div>
        {/* Detaylar (hover'da kaybolacak) */}
        <div className="top-project-details p-2.5 sm:p-3 flex items-end gap-2.5 bg-hero-top-card-gradient absolute bottom-0 left-0 w-full z-[3] transition-all duration-300 ease-out group-hover:opacity-0 group-hover:translate-y-full pointer-events-none group-hover:pointer-events-auto">
          <Image src={coverUrl} alt={`${title} Kapak`} width={60} height={60} className="top-project-cover w-[60px] h-[60px] object-cover rounded border-2 border-[rgba(26,20,35,0.7)] shadow-md flex-shrink-0" />
          <div className="top-project-text flex flex-col justify-end flex-grow overflow-hidden">
            <span className={`project-type ${typeColor} text-white inline-block self-start text-2xs font-semibold rounded uppercase tracking-wider px-2 py-0.5 mb-1 leading-none`}>{type}</span>
            <span className="project-title font-semibold text-hero-top-card-text text-base truncate shadow-black/50 text-shadow-sm">{title}</span>
            <span className="project-date text-hero-top-card-date-text text-xs shadow-black/30 text-shadow-sm">{date}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TopProjectCard;