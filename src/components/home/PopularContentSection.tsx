// src/components/home/PopularContentSection.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PopularContentCard from '@/components/ui/PopularContentCard'; // Oluşturduğumuz kart
import DropdownControl from '@/components/ui/DropdownControl'; // Oluşturduğumuz dropdown

// Font Awesome ikonlarını React component'leri olarak kullanmak için (opsiyonel)
// Veya CDN'den gelen class'ları kullanmaya devam edebilirsiniz.
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSortAlphaDown, faSortAlphaUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

// Sahte Veri (Daha sonra API'den gelecek)
// Her objede type, category, title, likes, dateRaw (Date objesi), date (string) vb. alanlar olmalı
const allPopularItemsSample = [
  // Oyunlar
  { id: 'pop-game-1', slug: 'efsanevi-macera-rpg', title: "Efsanevi Macera RPG", type: 'Oyun' as const, category: "rpg", bannerImageUrl: "/images/game-banner-1.jpg", coverImageUrl: "/images/game-cover-1.jpg", description: "Geniş bir dünyada geçen, epik görevlerle dolu bir RPG.", date: "20 Eyl 2023", dateRaw: new Date(2023, 8, 20), likes: 1256, dislikes: 32, favorites: 980 },
  { id: 'pop-game-2', slug: 'hizli-yaris-sampiyonu', title: "Hızlı Yarış Şampiyonu", type: 'Oyun' as const, category: "yaris", bannerImageUrl: "/images/game-banner-2.jpg", coverImageUrl: "/images/game-cover-2.jpg", description: "Adrenalin dolu pistlerde son sürat bir yarış deneyimi.", date: "15 Eki 2023", dateRaw: new Date(2023, 9, 15), likes: 980, dislikes: 50, favorites: 750 },
  { id: 'pop-game-3', slug: 'strateji-dehalari', title: "Strateji Dehaları", type: 'Oyun' as const, category: "strateji", bannerImageUrl: "/images/game-banner-3.jpg", coverImageUrl: "/images/game-cover-3.jpg", description: "Ordularını yönet, taktiklerini geliştir ve zafer kazan.", date: "01 Kas 2023", dateRaw: new Date(2023, 10, 1), likes: 1500, dislikes: 25, favorites: 1100 },
  { id: 'pop-game-4', slug: 'bulmaca-ustasi', title: "Bulmaca Ustası", type: 'Oyun' as const, category: "bulmaca", bannerImageUrl: "/images/game-banner-4.jpg", coverImageUrl: "/images/game-cover-4.jpg", description: "Zihin zorlayan yüzlerce bulmaca seni bekliyor.", date: "28 Eyl 2023", dateRaw: new Date(2023, 8, 28), likes: 750, dislikes: 10, favorites: 600 },
  { id: 'pop-game-5', slug: 'uzay-kesifleri-online', title: "Uzay Keşifleri Online", type: 'Oyun' as const, category: "mmo", bannerImageUrl: "/images/game-banner-5.jpg", coverImageUrl: "/images/game-cover-5.jpg", description: "Gezegenleri keşfet, ittifaklar kur, evreni fethet.", date: "10 Ara 2023", dateRaw: new Date(2023, 11, 10), likes: 2100, dislikes: 80, favorites: 1800 },
  // Animeler
  { id: 'pop-anime-1', slug: 'gizemli-ormanin-koruyuculari', title: "Gizemli Ormanın Koruyucuları", type: 'Anime' as const, category: "macera", bannerImageUrl: "/images/anime-banner-1.jpg", coverImageUrl: "/images/anime-cover-1.jpg", description: "Kadim bir ormanı ve sırlarını koruyan genç kahramanlar.", date: "05 Eyl 2023", dateRaw: new Date(2023, 8, 5), likes: 1800, dislikes: 40, favorites: 1300 },
  { id: 'pop-anime-2', slug: 'sehir-isiklari-dedektifi', title: "Şehir Işıkları Dedektifi", type: 'Anime' as const, category: "polisiye", bannerImageUrl: "/images/anime-banner-2.jpg", coverImageUrl: "/images/anime-cover-2.jpg", description: "Neon ışıklı metropolde karmaşık davaları çözen bir dedektif.", date: "22 Eki 2023", dateRaw: new Date(2023, 9, 22), likes: 1100, dislikes: 30, favorites: 850 },
  { id: 'pop-anime-3', slug: 'zaman-yolcusunun-gunlugu', title: "Zaman Yolcusunun Günlüğü", type: 'Anime' as const, category: "bilimkurgu", bannerImageUrl: "/images/anime-banner-3.jpg", coverImageUrl: "/images/anime-cover-3.jpg", description: "Geçmişi ve geleceği değiştirebilecek bir keşif.", date: "12 Kas 2023", dateRaw: new Date(2023, 10, 12), likes: 1650, dislikes: 65, favorites: 1200 },
  // ... (Daha fazla örnek ekleyebilirsiniz)
];

// Dropdown'lar için seçenekler
const azSortItems = [
  { label: "A-Z'ye Göre Sırala", value: 'a-z' },
  { label: "Z-A'ya Göre Sırala", value: 'z-a' },
];
const categoryItemsOyun = [ // Oyun kategorileri (örnek)
  { label: "Tümü", value: 'all' },
  { label: "RPG", value: 'rpg' },
  { label: "Yarış", value: 'yaris' },
  { label: "Strateji", value: 'strateji' },
  { label: "Bulmaca", value: 'bulmaca' },
  { label: "MMO", value: 'mmo' },
];
const categoryItemsAnime = [ // Anime kategorileri (örnek)
  { label: "Tümü", value: 'all' },
  { label: "Macera", value: 'macera' },
  { label: "Polisiye", value: 'polisiye' },
  { label: "Bilim Kurgu", value: 'bilimkurgu' },
];
const sortItems = [
  { label: "Popülerliğe Göre", value: 'popular' },
  { label: "Eklenme Tarihine Göre (Yeni)", value: 'newest' },
  { label: "Eklenme Tarihine Göre (Eski)", value: 'oldest' },
  { label: "Beğeni Sayısına Göre", value: 'likes' },
];


const PopularContentSection = () => {
  const [activeContentType, setActiveContentType] = useState<'Oyun' | 'Anime'>('Oyun');
  const [currentAZSort, setCurrentAZSort] = useState<string | null>(null); // 'a-z', 'z-a', or null
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [currentSortBy, setCurrentSortBy] = useState<string>('popular');

  const filteredAndSortedItems = useMemo(() => {
    let items = allPopularItemsSample.filter(item => item.type === activeContentType);

    if (currentCategory !== 'all') {
      items = items.filter(item => item.category.toLowerCase() === currentCategory.toLowerCase());
    }

    if (currentAZSort === 'a-z') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentAZSort === 'z-a') {
      items.sort((a, b) => b.title.localeCompare(a.title));
    } else { // A-Z sıralaması yoksa diğer sıralama kriterlerini uygula
        if (currentSortBy === 'newest') {
            items.sort((a, b) => b.dateRaw.getTime() - a.dateRaw.getTime());
        } else if (currentSortBy === 'oldest') {
            items.sort((a, b) => a.dateRaw.getTime() - b.dateRaw.getTime());
        } else if (currentSortBy === 'likes') {
            items.sort((a, b) => b.likes - a.likes);
        } else if (currentSortBy === 'popular') { // Popülerlik için beğeni + favori gibi bir skor olabilir. Şimdilik sadece beğeni.
            items.sort((a, b) => (b.likes + (b.favorites || 0)) - (a.likes + (a.favorites || 0)));
        }
    }
    return items;
  }, [activeContentType, currentAZSort, currentCategory, currentSortBy]);

  const handleContentTypeChange = (type: 'Oyun' | 'Anime') => {
    setActiveContentType(type);
    setCurrentCategory('all'); // Tip değişince kategoriyi sıfırla
    setCurrentAZSort(null); // Tip değişince A-Z sıralamasını sıfırla
    // setCurrentSortBy('popular'); // İsteğe bağlı: Sıralamayı da varsayılana döndür
  };
  
  const currentCategoryItems = activeContentType === 'Oyun' ? categoryItemsOyun : categoryItemsAnime;

  return (
    <section className="popular-content-section bg-section-bg-alt py-10 lg:py-16">
      <div className="container mx-auto">
        {/* Başlık ve Filtreler */}
        <div className="popular-content-header flex flex-col md:flex-row justify-between items-center mb-8 md:mb-10">
          {/* Sol Taraf: Oyun/Anime Butonları ve Başlık */}
          {/* Mobil için dikey, md ve üzeri için yatay yapı */}
          <div className="popular-section-title-group flex flex-col md:flex-row items-center gap-3 md:gap-5 mb-6 md:mb-0">
            {/* Başlık mobil için en üste alınabilir */}
            <h2 className="section-title popular-title text-xl sm:text-2xl lg:text-3xl font-bold text-prestij-text-primary whitespace-nowrap order-1 md:order-2">
              Herkesin Beğendiği İçerikler
            </h2>
            {/* Butonlar için bir sarmalayıcı div */}
            <div className="flex gap-3 order-2 md:order-1"> {/* md:order-1 ile Oyun butonu başlığın soluna geçer */}
              <button
                onClick={() => handleContentTypeChange('Oyun')}
                className={`btn filter-btn text-sm sm:text-base py-1.5 px-4 sm:px-5 rounded-full border transition-colors
                            ${activeContentType === 'Oyun' 
                              ? 'bg-filter-btn-active-bg text-filter-btn-active-text border-filter-btn-active-border' 
                              : 'bg-transparent text-filter-btn-text border-filter-btn-border hover:bg-filter-btn-hover-bg hover:text-filter-btn-hover-text hover:border-filter-btn-hover-border'}`}
              >
                Oyun
              </button>
            </div>
            <div className="order-3 md:order-3"> {/* Anime butonu md'de de sağda kalır */}
              <button
                onClick={() => handleContentTypeChange('Anime')}
                className={`btn filter-btn text-sm sm:text-base py-1.5 px-4 sm:px-5 rounded-full border transition-colors
                            ${activeContentType === 'Anime' 
                              ? 'bg-filter-btn-active-bg text-filter-btn-active-text border-filter-btn-active-border' 
                              : 'bg-transparent text-filter-btn-text border-filter-btn-border hover:bg-filter-btn-hover-bg hover:text-filter-btn-hover-text hover:border-filter-btn-hover-border'}`}
              >
                Anime
              </button>
            </div>
          </div>

          {/* Sağ Taraf: Dropdown Kontrolleri */}
          <div className="content-controls-wrapper flex flex-wrap justify-center md:justify-end items-center gap-2 sm:gap-3">
            <DropdownControl
              buttonId="azSortToggle"
              buttonLabel={currentAZSort === 'a-z' ? "A-Z'ye Göre" : currentAZSort === 'z-a' ? "Z-A'ya Göre" : "A-Z"}
              buttonIcon={<i className="fas fa-sort-alpha-down text-xs"></i>}
              items={azSortItems}
              onItemSelected={(value) => {setCurrentAZSort(value); setCurrentSortBy('popular'); /* A-Z seçilince diğer sıralamayı sıfırla */}}
              menuId="azSortMenu"
            />
            <DropdownControl
              buttonId="categoryToggle"
              buttonLabel={currentCategoryItems.find(c => c.value === currentCategory)?.label || "Kategoriler"}
              buttonIcon={<i className="fas fa-chevron-down text-xs"></i>}
              items={currentCategoryItems}
              onItemSelected={setCurrentCategory}
              menuId="categoryMenu"
            />
            <DropdownControl
              buttonId="sortToggle"
              buttonLabel={sortItems.find(s => s.value === currentSortBy)?.label || "Sırala"}
              buttonIcon={<i className="fas fa-chevron-down text-xs"></i>}
              items={sortItems}
              onItemSelected={(value) => {setCurrentSortBy(value); setCurrentAZSort(null); /* Diğer sıralama seçilince A-Z'yi sıfırla */}}
              menuId="sortMenu"
            />
          </div>
        </div>

        {/* İçerik Grid'i */}
        {filteredAndSortedItems.length > 0 ? (
          <div className="popular-games-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {filteredAndSortedItems.map((item) => (
              <PopularContentCard
                key={item.id}
                slug={item.slug}
                title={item.title}
                type={item.type}
                bannerImageUrl={item.bannerImageUrl}
                coverImageUrl={item.coverImageUrl}
                description={item.description}
                date={item.date}
                likes={item.likes}
                dislikes={item.dislikes}
                favorites={item.favorites}
                itemTypePath={item.type === 'Oyun' ? 'oyunlar' : 'animeler'}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-prestij-text-muted py-10">Bu kriterlere uygun içerik bulunamadı.</p>
        )}
      </div>
    </section>
  );
};

export default PopularContentSection;