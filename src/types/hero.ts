// src/types/hero.ts (Yeni dosya veya mevcut bir types dosyasına ekleyin)
export interface HeroProjectData {
  id: string | number;
  slug: string;
  title: string;
  type: string; // "oyun" veya "anime" (API'den gelen ham hali)
  description?: string | null;
  bannerImagePublicId?: string | null; // MainShowcase ana banner ve SideShowcase yan banner için
  coverImagePublicId?: string | null;  // MainShowcase kapak ve SideShowcase kapak için
}