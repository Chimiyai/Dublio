// src/app/page.tsx
// Tüm diğer importları ve sahte verileri şimdilik yoruma al veya sil
// import HeroSection from '@/components/home/HeroSection';
// ... diğer component importları ...
// ... sahte veri tanımlamaları ...

export const metadata = {
  title: 'Ana Sayfa Test - Prestij Dublaj',
  description: 'Ana sayfa entegrasyon testi.',
};

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Ana Sayfa İçeriği Burada Olacak</h1>
      <p className="text-center">Şu an sadece Footer component'ini test ediyoruz.</p>
      {/*
        <HeroSection
          topProjects={mockTopProjects}
          initialMainShowcase={initialMainShowcaseData}
          sideListItems={mockSideListData}
        />
        <DubbedGamesSection
          title="Dublajlanan Oyunlar"
          totalCount={mockDubbedGames.length}
          items={mockDubbedGames}
          swiperClassName="dubbed-games-swiper"
        />
        // ... Diğer component çağrılarını da yoruma al ...
      */}
    </div>
  );
}