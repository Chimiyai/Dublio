// src/components/profile/FavoriteArtistCard.tsx (Yeni Dosya)
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { UserCircleIcon } from '@heroicons/react/24/solid'; // Veya uygun bir sanatçı ikonu
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'; // Beğeni/Favori sayısı için

interface FavoriteArtistCardProps {
  artist: {
    id: number;
    firstName: string;
    lastName: string;
    imagePublicId: string | null;
    bio?: string | null;
    // likeCount?: number; // Sanatçının aldığı beğeni sayısı (eğer varsa)
  };
}

const FavoriteArtistCard: React.FC<FavoriteArtistCardProps> = ({ artist }) => {
  const fullName = `${artist.firstName} ${artist.lastName}`;
  const artistProfileUrl = `/sanatcilar/${artist.id}`; // Veya slug

  const imageDisplayWidth = 180; // Kartta görünecek resmin yaklaşık genişliği
  const imageDisplayHeight = 180; // Kartta görünecek resmin yaklaşık yüksekliği (kare için)

  const finalArtistImageUrl = getCloudinaryImageUrlOptimized(
    artist.imagePublicId,
    { 
      width: imageDisplayWidth * 2, // Daha yüksek çözünürlüklü kaynak isteyelim (retina vb. için)
      height: imageDisplayHeight * 2,
      crop: 'limit', // VEYA 'fit'. 'limit' aspect ratioyu koruyarak verilen boyutları aşmamasını sağlar.
                      // 'fit' ise tam o boyutlara sığdırır, boşluk kalabilir.
      quality: 'auto:good' 
    },
    'avatar'
  );

  return (
    <Link
      href={artistProfileUrl}
      className="group flex flex-col bg-gray-800/70 hover:bg-gray-700/90 rounded-xl shadow-lg overflow-hidden 
                 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl h-full"
    >
      {/* Resim Alanı */}
      <div className="aspect-[1] relative w-full overflow-hidden"> {/* Daha yatay bir banner gibi veya kare (aspect-square) */}
        {artist.imagePublicId ? (
          <Image
            src={finalArtistImageUrl}
            alt={fullName}
            fill
            className="object-cover" // <<<< DEĞİŞİKLİK: object-cover yerine object-contain
            sizes="(max-width: 640px) 50vw, 180px" // Yaklaşık gösterim boyutuna göre
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserCircleIcon className="w-16 h-16 text-gray-500" />
          </div>
        )}
        {/* İsteğe bağlı: Resim üzerine hafif bir gradyan eklenebilir */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Bilgi Alanı */}
      <div className="p-3 sm:p-4 flex-grow flex flex-col">
        <h3 
            className="text-sm sm:text-base font-semibold text-white group-hover:text-purple-400 transition-colors mb-1 truncate" 
            title={fullName}
        >
          {fullName}
        </h3>
        {artist.bio && (
          <p className="text-xs text-gray-400 line-clamp-2 sm:line-clamp-3 leading-relaxed flex-grow">
            {artist.bio}
          </p>
        )}
        {!artist.bio && (
            <p className="text-xs text-gray-500 italic flex-grow">Biyografi mevcut değil.</p>
        )}
        {/* İsteğe bağlı: En bilinen rolü veya beğeni sayısı eklenebilir */}
        {/* <div className="mt-auto pt-2 text-2xs text-purple-400/80">
          Ses Sanatçısı
        </div> */}
      </div>
    </Link>
  );
};

export default FavoriteArtistCard;