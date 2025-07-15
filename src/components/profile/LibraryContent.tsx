// src/components/profile/LibraryContent.tsx
"use client";

import { useState, useEffect } from 'react';
import PopularContentCard from '@/components/ui/PopularContentCard';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { formatDate } from '@/lib/utils'; // Tarih formatlama fonksiyonunu import et

// API'den dönen kütüphane öğesi için tip tanımı (daha eksiksiz)
interface LibraryItem {
  id: number;
  slug: string;
  title: string;
  type: string;
  coverImagePublicId: string | null;
  bannerImagePublicId: string | null; // Tip tanımına eklendi
  description: string | null;         // Tip tanımına eklendi
  releaseDate: Date | string | null;  // Tip tanımına eklendi
  likeCount: number;
  dislikeCount: number;               // Tip tanımına eklendi
  favoriteCount: number;              // Tip tanımına eklendi
}

interface LibraryContentProps {
  userId: number;
}

const LibraryContent: React.FC<LibraryContentProps> = ({ userId }) => {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/library`);
        if (!response.ok) throw new Error('Kütüphane verileri yüklenemedi.');
        const data = await response.json();
        setLibraryItems(data.libraryItems || []);
      } catch (error) {
        console.error(error);
        setLibraryItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibrary();
  }, [userId]);

  if (isLoading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6">
          <h2 className="text-xl lg:text-2xl font-semibold text-white">Oyun Kütüphanesi</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-dublio-sidebar-bg/50 shadow-lg">
                <div className="w-full aspect-[3/4] bg-dublio-input-bg/50"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-dublio-input-bg/50 rounded w-3/4"></div>
                  <div className="h-4 bg-dublio-input-bg/50 rounded w-1/2"></div>
                </div>
            </div>
          ))}
        </div>
      </div>
    );
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Oyun Kütüphanesi</h2>
        <span className="text-sm text-gray-400 mt-1 sm:mt-0">Toplam {libraryItems.length} Oyun</span>
      </div>
       {libraryItems.length === 0 ? (
        <div className="text-center text-gray-400 py-16 px-6 bg-dublio-sidebar-bg/30 rounded-lg">
          <PhotoIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white">Kütüphane Boş</h3>
          <p className="mt-1 text-sm">Satın aldığınız ücretli oyunlar burada görünecektir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5">
          {libraryItems.map((item) => (
             <PopularContentCard
                key={item.id}
                slug={item.slug}
                title={item.title}
                type="Oyun"
                // --- ARTIK TÜM PROPLARI SAĞLIYORUZ ---
                coverImageUrl={item.coverImagePublicId}
                bannerImageUrl={item.bannerImagePublicId}
                description={item.description}
                date={item.releaseDate ? formatDate(item.releaseDate, { day: 'numeric', month: 'short', year: 'numeric' }) : null}
                likes={item.likeCount}
                dislikes={item.dislikeCount}
                favorites={item.favoriteCount}
                itemTypePath="projeler"
             />
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryContent;