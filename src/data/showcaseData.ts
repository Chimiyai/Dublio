// src/data/showcaseData.ts (GÜNCELLENMİŞ)
import type { ShowcaseCardData, CategoryInfo } from '@/types/showcase'; // Merkezi tipleri import et

// Örnek kategoriler (bu veriyi API'den de alabilirsiniz veya sabit tutabilirsiniz)
const sampleCategories: CategoryInfo[] = [
  { id: 1, name: 'Aksiyon', slug: 'aksiyon' },
  { id: 2, name: 'Macera', slug: 'macera' },
  { id: 3, name: 'Fantastik', slug: 'fantastik' },
];

export const dubbedAnimeDataSample: ShowcaseCardData[] = [ // Tipi ShowcaseCardData[] yapın
  {
    slug: 'anime-1',
    title: 'Anime Başlık 1',
    categories: [sampleCategories[0], sampleCategories[1]], // Örnek kategoriler atandı
    coverImageUrl: '/images/placeholder-cover.jpg', // Veya Cloudinary ID
    bannerImageUrl: '/images/placeholder-banner.jpg', // Veya Cloudinary ID
    description: 'Bu birinci animenin açıklamasıdır.'
  },
  {
    slug: 'anime-2',
    title: 'Anime Başlık 2',
    categories: [sampleCategories[2]], // Örnek kategori
    coverImageUrl: '/images/placeholder-cover.jpg',
    bannerImageUrl: '/images/placeholder-banner.jpg',
    description: 'Bu ikinci animenin açıklamasıdır.'
  },
  // ... diğer animeler
];