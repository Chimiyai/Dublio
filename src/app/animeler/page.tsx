// src/app/animeler/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react'; // Suspense importu
import AnimesPageClient from '@/components/animes/AnimesPageClient';
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Dublajlanan Animeler | PrestiJ Studio',
  description: 'PrestiJ Studio tarafından Türkçe dublajı yapılan tüm animeleri keşfedin, filtreleyin ve sıralayın.',
};

async function getCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories;
  } catch (error) {
    console.error("Kategoriler çekilemedi (animeler sayfası):", error);
    return [];
  }
}

// Yükleniyor göstergesi için basit bir component
function AnimesPageLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Placeholder */}
      <div className="w-full lg:w-1/4 xl:w-1/5">
        <div className="bg-prestij-sidebar-bg p-5 rounded-lg shadow-lg space-y-6 animate-pulse">
          <div className="h-8 bg-prestij-input-bg rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-6 bg-prestij-input-bg rounded"></div>
            <div className="h-4 bg-prestij-input-bg rounded w-5/6"></div>
            <div className="h-4 bg-prestij-input-bg rounded w-4/6"></div>
          </div>
        </div>
      </div>
      {/* Grid Placeholder */}
      <div className="w-full lg:w-3/4 xl:w-4/5">
        <div className="h-8 bg-prestij-input-bg rounded w-1/2 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-prestij-sidebar-bg shadow-lg">
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

export default async function AnimelerPage() {
  const categories = await getCategories();

  return (
    <div className="bg-prestij-chat-bg min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <nav aria-label="breadcrumb" className="mb-2">
            <ol className="flex items-center space-x-1.5 text-xs sm:text-sm text-prestij-text-muted">
              <li><a href="/" className="hover:text-prestij-text-secondary">Ana Sayfa</a></li>
              <li><span className="text-prestij-text-muted">/</span></li>
              <li><span className="font-medium text-prestij-text-primary">Animeler</span></li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Dublajlanan Animeler
          </h1>
          <p className="mt-2 text-base sm:text-lg text-prestij-text-secondary">
            Aradığın Türkçe dublajlı animeyi keşfet. Türlere göre filtrele veya popülerliğe göre sırala.
          </p>
        </div>
<Suspense fallback={<AnimesPageLoading />}>
        <AnimesPageClient initialCategories={categories} />
        </Suspense>
      </div>
    </div>
  );
}