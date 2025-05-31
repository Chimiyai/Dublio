// src/app/animeler/page.tsx
import { Metadata } from 'next';
import AnimesPageClient from '@/components/animes/AnimesPageClient'; // YENİ Client Component
import prisma from '@/lib/prisma';
import { Category } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Dublajlanan Animeler | PrestiJ Studio',
  description: 'PrestiJ Studio tarafından Türkçe dublajı yapılan tüm animeleri keşfedin, filtreleyin ve sıralayın.',
};

// Kategorileri çekme fonksiyonu (oyunlarla aynı olabilir, çünkü tüm kategorileri alıyoruz)
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

        <AnimesPageClient initialCategories={categories} />
      </div>
    </div>
  );
}