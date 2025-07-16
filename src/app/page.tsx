// src/app/page.tsx
// src/app/page.tsx

import prisma from '@/lib/prisma';
// DİKKAT: Prisma tiplerini ve enum'ları import ediyoruz.
import { Prisma, InteractionType } from '@prisma/client';

// İstemci bileşenleri
import HeroSection from '@/components/home/HeroSection';
import ProjectCarousel from '@/components/home/ProjectCarousel';
import TalentShowcase from '@/components/home/TalentShowcase';

// --- Proje Kartı için Sorgu ve Tip ---
const projectCardQuery = {
  include: {
    content: { select: { title: true, coverImageUrl: true, bannerUrl: true } }, // Banner'ı da alalım hero için
    team: { select: { name: true, slug: true } },
    // DİKKAT: _count sorgusunu doğru enum tipiyle güncelliyoruz.
    _count: {
      select: {
        interactions: { 
          where: { type: InteractionType.LIKE } // 'LIKE' yerine InteractionType.LIKE
        }
      }
    }
  }
};
export type ProjectForCard = Prisma.ProjectGetPayload<typeof projectCardQuery>;

// --- Demo Kartı için Sorgu ve Tip ---
const demoCardQuery = {
  include: {
    author: { select: { username: true, profileImage: true } }
  }
};
export type DemoForCard = Prisma.UserDemoGetPayload<typeof demoCardQuery>;


// --- Veri Çekme Fonksiyonları (Artık doğru tiplerle çalışıyor) ---

async function getLatestCompletedProjects(limit: number = 5): Promise<ProjectForCard[]> {
  const projects = await prisma.project.findMany({
    where: { status: 'COMPLETED', isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...projectCardQuery // Sorguyu burada yayıyoruz
  });
  return projects;
}

async function getPopularProjects(limit: number = 5): Promise<ProjectForCard[]> {
  const projects = await prisma.project.findMany({
    where: { isPublic: true },
    orderBy: {
      interactions: {
        _count: 'desc'
      }
    },
    take: limit,
    ...projectCardQuery // Sorguyu burada yayıyoruz
  });
  return projects;
}

async function getLatestDemos(limit: number = 6): Promise<DemoForCard[]> {
  const demos = await prisma.userDemo.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...demoCardQuery // Sorguyu burada yayıyoruz
  });
  return demos;
}


// --- Ana Sayfa Bileşeni (Sunucu) ---
export default async function HomePage() {
  const [
    latestProjects, 
    popularProjects, 
    latestDemos
  ] = await Promise.all([
    getLatestCompletedProjects(),
    getPopularProjects(),
    getLatestDemos()
  ]);
  
  const heroProject = popularProjects[0] || null;

  return (
    <main className="bg-[#101014] text-white">
      <HeroSection project={heroProject} />
      <ProjectCarousel title="Yeni Tamamlananlar" projects={latestProjects} />
      <ProjectCarousel title="En Popüler Projeler" projects={popularProjects} />
      <TalentShowcase title="Keşfedilmeyi Bekleyen Yetenekler" demos={latestDemos} />
    </main>
  );
}