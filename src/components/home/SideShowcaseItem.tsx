// src/components/home/SideShowcaseItem.tsx
"use client";
import Image from 'next/image';
import Link from 'next/link'; // onClick ile çalıştığı için Link gerekmeyebilir, button da olabilir

interface SideShowcaseItemProps {
  cardTitle: string;
  type: 'Oyun' | 'Anime';
  coverUrl: string;
  bannerUrl: string; // Mini kartın sağ tarafındaki banner için
  isActive: boolean;
  onClick: () => void;
}

const SideShowcaseItem: React.FC<SideShowcaseItemProps> = ({ cardTitle, type, coverUrl, bannerUrl, isActive, onClick }) => {
  const typeColor = type === 'Oyun' ? 'bg-project-type-oyun' : 'bg-project-type-anime';
  
  return (
    <button // Link yerine button, çünkü tıklama state değiştiriyor
      onClick={onClick}
      className={`side-list-item-link block rounded-lg transition-all duration-300 ease-out relative overflow-hidden bg-hero-side-list-item-bg flex-grow flex group
                  hover:-translate-y-1 hover:scale-[1.04] hover:shadow-hero-side-list-item-hover hover:bg-hero-side-list-item-bg-hover hover:z-10
                  ${isActive ? 'shadow-hero-side-list-item-active bg-hero-side-list-item-active z-[15]' : 'shadow-sm'}`}
    >
      <div className="side-list-item flex items-center w-full p-2 relative z-[1]">
        <Image src={coverUrl} alt={`${cardTitle} Kapak`} width={50} height={50} className="side-item-cover w-[50px] h-[50px] object-cover rounded-md mr-2.5 flex-shrink-0 border border-white/10" />
        <div className="side-item-main-content flex-grow relative z-[2] flex flex-col justify-center overflow-hidden text-left">
          <span className={`project-type ${typeColor} text-white inline-block self-start text-2xs font-semibold rounded uppercase tracking-wider px-1.5 py-0.5 leading-none mb-0.5`}>{type}</span>
          <span className="side-item-title text-hero-side-list-item-text text-sm font-medium truncate text-shadow-sm leading-tight">{cardTitle}</span>
        </div>
        {/* Sağdaki banner arka planı */}
        <div className="side-item-banner-background absolute top-0 right-0 w-[70%] h-full bg-cover bg-right z-[1] rounded-r-lg overflow-hidden">
          <Image src={bannerUrl} alt="" fill className="object-cover" />
          <div className="side-item-banner-fade-to-left absolute inset-0 bg-hero-side-list-fade"></div>
        </div>
      </div>
      {/* Glow efekti için (isteğe bağlı) */}
      <div className={`absolute -inset-2.5 bg-gradient-radial from-prestij-purple/30 via-prestij-purple/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out rounded-xl pointer-events-none ${isActive ? 'opacity-85 scale-105' : ''}`}></div>
    </button>
  );
};

// CSS'e eklenmesi gerekebilecek bir gradient (veya tailwind.config.js'e)
// .bg-gradient-radial { background-image: radial-gradient(ellipse at center, var(--tw-gradient-stops)); }
// tailwind.config.js'e eklemek daha iyi:
// backgroundImage: {
//   'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
// }

export default SideShowcaseItem;