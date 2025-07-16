// src/app/page.tsx

import prisma from '@/lib/prisma';
import { Prisma, ProjectStatus } from '@prisma/client';

// İstemci bileşenleri
import HeroSection from '@/components/home/HeroSection';
import ProjectCarousel from '@/components/home/ProjectCarousel';
import TalentShowcase from '@/components/home/TalentShowcase';

// --- Proje Kartı için Tip ve Include Objesi ---
const projectCardArgs = {
  include: {
    content: { select: { title: true, coverImageUrl: true, bannerUrl: true } },
    team: { select: { name: true, slug: true } },
    _count: true
  }
};
export type ProjectForCard = Prisma.ProjectGetPayload<typeof projectCardArgs>;

// --- Demo Kartı için Tip ve Sorgu ---
const demoCardQuery = {
  include: {
    author: { select: { username: true, profileImage: true } }
  }
};
export type DemoForCard = Prisma.UserDemoGetPayload<typeof demoCardQuery>;


// --- Veri Çekme Fonksiyonları (YENİ MANTIKLA) ---

async function getLatestCompletedProjects(limit: number = 5): Promise<ProjectForCard[]> {
  const projects = await prisma.project.findMany({
    where: { status: ProjectStatus.COMPLETED, isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...projectCardArgs
  });
  return projects;
}

// === POPÜLER PROJELERİ BULMA FONKSİYONU (YENİ) ===
async function getPopularProjects(limit: number = 5): Promise<ProjectForCard[]> {
  const projects = await prisma.project.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...projectCardArgs
  });
  return projects;
}

async function getLatestDemos(limit: number = 6): Promise<DemoForCard[]> {
  const demos = await prisma.userDemo.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...demoCardQuery
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
  
  const heroProject = popularProjects.length > 0 ? popularProjects[0] : (latestProjects.length > 0 ? latestProjects[0] : null);

  return (
    <main className="bg-[#101014] text-white">
      <HeroSection project={heroProject} />
      <ProjectCarousel title="Yeni Tamamlananlar" projects={latestProjects} />
      <ProjectCarousel title="En Popüler Projeler" projects={popularProjects} />
      <TalentShowcase title="Keşfedilmeyi Bekleyen Yetenekler" demos={latestDemos} />
    </main>
  );
}