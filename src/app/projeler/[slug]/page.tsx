// src/app/projeler/[slug]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { Prisma } from '@prisma/client';
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'; // Bu bizim istemci bileşenimiz

// 1. Prisma'nın otomatik tip oluşturucusunu kullanarak veri yapımızı tanımlıyoruz.
const projectDetailQuery = {
  include: {
    team: { select: { name: true, slug: true } },
    content: true,
    interactions: {
      select: { userId: true, type: true }
    },
  }
}; // Validator'ı şimdilik kaldırıp, objeyi doğrudan tanımlıyoruz.

// 2. Oluşturulan tipi export ediyoruz ki istemci bileşeni de kullanabilsin.
export type ProjectWithDetails = Prisma.ProjectGetPayload<{
  // projectDetailQuery'nin tipini doğrudan buraya yazıyoruz.
  include: typeof projectDetailQuery.include
}>;

export interface UserInteractionData {
    isLoggedIn: boolean;
    liked: boolean;
    favorited: boolean;
}

// 3. Veri çekme fonksiyonumuz (yeni şemaya göre)
async function getProjectDetails(projectId: number): Promise<ProjectWithDetails | null> {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        ...projectDetailQuery
    });
    return project;
}

// 4. Kullanıcıya özel etkileşim verisini çekme fonksiyonu (yeni şemaya göre)
async function getUserSpecificData(userId: number | undefined, projectId: number): Promise<Omit<UserInteractionData, 'isLoggedIn'>> {
    if (!userId) return { liked: false, favorited: false };

    const interactions = await prisma.interaction.findMany({
        where: {
            userId: userId,
            targetId: projectId,
            targetType: 'PROJECT',
            type: { in: ['LIKE', 'FAVORITE'] },
        }
    });

    return {
        liked: interactions.some(i => i.type === 'LIKE'),
        favorited: interactions.some(i => i.type === 'FAVORITE'),
    };
}


// 5. Ana Sayfa Bileşeni (Sunucu)
export default async function ProjectDetailPageServer({ params }: { params: { slug: string } }) {
  // URL'den gelen slug'ın bir sayı (ID) olduğunu varsayıyoruz.
  const projectId = parseInt(params.slug, 10);
  if (isNaN(projectId)) {
    notFound(); // Eğer sayı değilse 404 göster.
  }

  // Gerekli tüm verileri paralel olarak çekiyoruz.
  const session = await getServerSession(authOptions);
  const project = await getProjectDetails(projectId);
  
  if (!project) {
    notFound();
  }

  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;
  const userInteractionStatus = await getUserSpecificData(userId, project.id);
  
  // Çektiğimiz tüm veriyi tek bir pakette istemciye gönderiyoruz.
  return (
    <ProjectDetailContent
      project={project}
      userInteraction={{
        isLoggedIn: !!userId,
        ...userInteractionStatus
      }}
    />
  );
}