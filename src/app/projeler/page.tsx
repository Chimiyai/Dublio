// src/app/projeler/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import ProjectsPageClient from '@/components/projects/ProjectsPageClient'; // YENİ YOL
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Türkçe Dublaj Projeler | PrestiJ Studio',
  description: 'PrestiJ Studio tarafından Türkçe dublajı yapılan tüm oyun ve animeleri keşfedin, filtreleyin ve sıralayın.',
  // Alternatif olarak, URL'deki type parametresine göre dinamik metadata da oluşturulabilir.
  // Ama bu client component içinde yönetileceği için şimdilik genel kalsın.
};

// Kategorileri sunucu tarafında çekip client component'e prop olarak geçiyoruz.
async function getCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories;
  } catch (error) {
    console.error("Kategoriler çekilemedi (projeler sayfası):", error);
    return []; // Hata durumunda boş dizi dön
  }
}

// Yükleniyor göstergesi (Placeholder)
function ProjectsPageLoadingSkeleton() {
  // Eski GamesPageLoading veya AnimesPageLoading component'lerinden birini
  // veya daha genel bir iskelet yapısını buraya koyabilirsin.
  // Örnek bir iskelet:
  return (
    <div className="flex flex-col lg:flex-row gap-x-8 gap-y-6 animate-pulse">
      {/* Sidebar Placeholder */}
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
        <div className="bg-prestij-sidebar-bg p-5 rounded-lg shadow-lg space-y-6">
          {/* Type Filter Placeholder */}
          <div className="h-6 bg-prestij-input-bg rounded w-1/2 mb-3"></div>
          <div className="flex space-x-2 mb-4">
            <div className="h-8 bg-prestij-input-bg rounded w-1/3"></div>
            <div className="h-8 bg-prestij-input-bg rounded w-1/3"></div>
            <div className="h-8 bg-prestij-input-bg rounded w-1/3"></div>
          </div>
          <div className="h-8 bg-prestij-input-bg rounded w-3/4 mb-4"></div> {/* Arama */}
          <div className="h-6 bg-prestij-input-bg rounded w-1/2 mb-3"></div> {/* Kategori Başlığı */}
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={`cat-load-${i}`} className="flex items-center space-x-2 p-1.5">
                <div className="h-4 w-4 bg-prestij-input-bg rounded"></div>
                <div className="h-4 bg-prestij-input-bg rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Grid Placeholder */}
      <div className="flex-grow min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="h-5 bg-prestij-input-bg rounded w-1/3"></div> {/* Sonuç sayısı */}
          <div className="h-10 bg-prestij-input-bg rounded w-48"></div> {/* Sıralama */}
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
          {[...Array(8)].map((_, i) => ( // Örnek 8 kart
            <div key={`proj-load-${i}`} className="rounded-xl overflow-hidden bg-prestij-sidebar-bg shadow-lg">
              <div className="w-full aspect-[3/4] bg-prestij-input-bg"></div>
              <div className="p-4 space-y-2">
                <div className="h-5 bg-prestij-input-bg rounded w-3/4"></div>
                <div className="h-4 bg-prestij-input-bg rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ProjelerPage() {
  const categories = await getCategories();

  return (
    <div className="bg-prestij-chat-bg min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Sayfa Başlığı ve Açıklama */}
        <div className="mb-8 md:mb-10">
          <nav aria-label="breadcrumb" className="mb-2">
            <ol className="flex items-center space-x-1.5 text-xs sm:text-sm text-prestij-text-muted">
              <li><a href="/" className="hover:text-prestij-text-secondary">Ana Sayfa</a></li>
              <li><span className="text-prestij-text-muted">/</span></li>
              <li><span className="font-medium text-prestij-text-primary">Projeler</span></li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Tüm Projeler
          </h1>
          <p className="mt-2 text-base sm:text-lg text-prestij-text-secondary">
            Aradığın Türkçe dublajlı oyun veya animeyi keşfet. Türe ve kategorilere göre filtrele.
          </p>
        </div>

        {/* Suspense ile Client Component'i sarmala */}
        {/* Client Component'in kendisi URL parametrelerini okuyacak */}
        <Suspense fallback={<ProjectsPageLoadingSkeleton />}>
          <ProjectsPageClient initialCategories={categories} />
        </Suspense>
      </div>
    </div>
  );
}