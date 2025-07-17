// src/app/page.tsx

import prisma from '@/lib/prisma';
import { Prisma, ProjectStatus } from '@prisma/client';

// İstemci bileşenleri
import HeroSection from '@/components/home/HeroSection';
import ProjectCarousel from '@/components/home/ProjectCarousel';
import TalentShowcase from '@/components/home/TalentShowcase';

// === 1. MERKEZİ TİP ve SORGULAMA ARGÜMANLARI ===

// Proje kartlarında gösterilecek TÜM veriler için tek bir sorgu objesi
const projectCardArgs = {
  include: {
    content: true, // Kartlar başlık, kapak resmi vb. için tüm content'i istiyor
    team: { select: { name: true, slug: true } },
    // DÜZELTME: İhtiyacımız olan sayıları `select` ile belirtiyoruz.
    _count: {
      select: {
        tasks: true,      // Örnek: Projedeki görev sayısı
        packages: true,   // Örnek: Yayınlanmış paket sayısı
        // NOT: Yorum/Beğeni için ayrı mantık gerekecek.
      }
    }
  }
} as const; // `as const` ile bu objenin değiştirilemez olduğunu belirtiyoruz.

// Bu sorgudan dönecek verinin tipini export edelim ki component'ler de kullanabilsin.
export type ProjectForCard = Prisma.ProjectGetPayload<typeof projectCardArgs>;

// Demo kartı için sorgu objesi ve tip
const demoCardArgs = {
  include: {
    author: { select: { username: true, profileImage: true } }
  }
} as const;

export type DemoForCard = Prisma.UserDemoGetPayload<typeof demoCardArgs>;


// === 2. VERİ ÇEKME FONKSİYONLARI (TEMİZLENMİŞ) ===

// Yeni tamamlanan projeleri çeken fonksiyon
async function getLatestCompletedProjects(limit: number = 5): Promise<ProjectForCard[]> {
  const projects = await prisma.project.findMany({
    where: { status: ProjectStatus.COMPLETED, isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...projectCardArgs // Merkezi sorgu objemizi kullanıyoruz
  });
  return projects;
}

// Popüler projeleri çeken fonksiyon
async function getPopularProjects(limit: number = 5): Promise<ProjectForCard[]> {
  // Popülerlik mantığı şimdilik en yeniler, gelecekte _count.likes gibi bir şeye göre sıralanabilir.
  const projects = await prisma.project.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' }, // Şimdilik popülerliği de en yeniye göre alalım
    take: limit,
    ...projectCardArgs // Merkezi sorgu objemizi kullanıyoruz
  });
  return projects;
}

// Son demoları çeken fonksiyon
async function getLatestDemos(limit: number = 6): Promise<DemoForCard[]> {
  return prisma.userDemo.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...demoCardArgs
  });
}


// === 3. ANA SAYFA BİLEŞENİ (DEĞİŞİKLİK YOK) ===
export default async function HomePage() {
  const [
    latestProjects, 
    popularProjects, 
    latestDemos
  ] = await Promise.all([
    getLatestCompletedProjects(5),
    getPopularProjects(5),
    getLatestDemos(6)
  ]);
  
  const heroProject = popularProjects[0] ?? latestProjects[0] ?? null;

  return (
    <main className="bg-[#101014] text-white">
      <HeroSection project={heroProject} />
      <ProjectCarousel title="Yeni Tamamlananlar" projects={latestProjects} />
      <ProjectCarousel title="En Popüler Projeler" projects={popularProjects} />
      <TalentShowcase title="Keşfedilmeyi Bekleyen Yetenekler" demos={latestDemos} />
    </main>
  );
}