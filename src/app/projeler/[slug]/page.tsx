// src/app/projeler/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import ProjectDetailContent from '@/components/projects/ProjectDetailContent'; // YENİ Client Component
import { RoleInProject } from '@prisma/client';

// ProjectDataForDetail tipi burada veya types dosyasında olabilir
export interface ProjectDataForDetail {
    id: number;
    slug: string;
    title: string;
    type: 'oyun' | 'anime';
    description: string | null;
    bannerImagePublicId: string | null;
    coverImagePublicId: string | null;
    releaseDate: Date | null;
    trailerUrl?: string | null;
    price?: number | null;
    currency?: string | null;
    externalWatchUrl?: string | null;
    likeCount: number;
    dislikeCount: number;
    favoriteCount: number;
    averageRating?: number;
    assignments: Array<{
    id: number;
    role: RoleInProject; // Prisma enum tipini kullan
    artist: { id: number; firstName: string; lastName: string; imagePublicId: string | null; slug?: string | null; }; // slug'ı opsiyonel yaptım
        voiceRoles: Array<{ character: { id: number; name: string; } }>;
    }>;
    categories: Array<{ category: { name: string; slug: string } }>;
    _count: { comments?: number; ratings?: number };
}
// UserInteraction tipi (ProjectInteractionButtonsProps'tan alınabilir)
export interface UserInteractionData {
    liked: boolean;
    disliked: boolean;
    favorited: boolean;
}


async function getProjectDetails(slug: string): Promise<ProjectDataForDetail | null> {
    // ... (Mevcut getProjectDetails fonksiyonunuz)
    const project = await prisma.project.findUnique({
    where: { slug: decodeURIComponent(slug) }, // type filtresi kaldırıldı
    select: {
      id: true,
      slug: true,
      title: true,
      type: true, // Bu alanı alıyoruz
      description: true,
      bannerImagePublicId: true,
      coverImagePublicId: true,
      releaseDate: true,
      price: true,
      currency: true,
      externalWatchUrl: true,
      trailerUrl: true,
      likeCount: true,
      dislikeCount: true,
      favoriteCount: true,
      averageRating: true,
      viewCount: true,
      _count: { select: { comments: true, ratings: true } },
      categories: {
        select: { category: { select: { name: true, slug: true } } }
      },
      assignments: {
        orderBy: [ { role: 'asc'}, { artist: { lastName: 'asc' } } ],
        select: {
          id: true,
          role: true,
          artist: {
            select: { id: true, firstName: true, lastName: true, imagePublicId: true, slug: true } // artist.slug eklendi
          },
          voiceRoles: {
            orderBy: { character: { name: 'asc' } },
            select: { character: { select: { id: true, name: true } } }
          }
        }
      },
      // ProjectImage: {} // Galeri olmadığı için bu kaldırıldı
    }
  });
    if (!project) return null;
    return project as unknown as ProjectDataForDetail;
}

async function getUserSpecificData(userId: number | undefined, projectId: number) {
    if (!userId) return { userHasGame: false, userInitialInteraction: { liked: false, disliked: false, favorited: false } };

    const userHasGame = !!await prisma.userOwnedGame.findUnique({
        where: { userId_projectId: { userId, projectId } }
    });
    const [likedEntry, dislikedEntry, favoritedEntry] = await Promise.all([
        prisma.projectLike.findUnique({ where: { userId_projectId: { userId, projectId } } }),
        prisma.projectDislike.findUnique({ where: { userId_projectId: { userId, projectId } } }),
        prisma.projectFavorite.findUnique({ where: { userId_projectId: { userId, projectId } } }),
    ]);
    const userInitialInteraction = {
        liked: !!likedEntry, disliked: !!dislikedEntry, favorited: !!favoritedEntry,
    };
    return { userHasGame, userInitialInteraction };
}


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectDetails(slug);
  if (!project) return { title: 'Proje Bulunamadı' };
  const typeTR = project.type === 'oyun' ? 'Oyun' : 'Anime';
  return {
    title: `${project.title} Türkçe Dublaj ${typeTR} | PrestiJ Studio`,
    description: project.description?.substring(0, 160) || `PrestiJ Studio tarafından Türkçe dublajı yapılan ${project.title} projesini keşfedin.`,
  };
}

export default async function ProjectDetailPageServer({ params }: { params: { slug: string } }) {
  const { slug: pageSlug } = await params;
  const session = await getServerSession(authOptions);
  const project = await getProjectDetails(pageSlug);

  if (!project) {
    notFound();
  }

  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;
  const { userHasGame, userInitialInteraction } = await getUserSpecificData(userId, project.id);

  return (
    <ProjectDetailContent
      project={project}
      isUserLoggedIn={!!session?.user?.id}
      userHasGame={project.type === 'oyun' ? userHasGame : false} // Sadece oyunlar için
      userInitialInteraction={userInitialInteraction}
    />
  );
}