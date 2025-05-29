// src/app/projeler/[slug]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { RoleInProject, DubbingArtist } from '@prisma/client';
import { formatProjectRole } from '@/lib/utils';
import ProjectDetailCover from '@/components/ProjectDetailCover';
import ArtistAvatar from '@/components/ArtistAvatar';
// YENİ:
import { ProjectInteractionButtonsProps } from '@/components/project/ProjectInteractionButtons';
import ProjectInteractionButtons from '@/components/project/ProjectInteractionButtons';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptions yolunu kontrol edin

// ... (ArtistForProjectDetail tipi ve generateMetadata fonksiyonu aynı kalabilir)
interface ProjectDetailPageProps {
  params: {
    slug: string;
  };
}

type ArtistForProjectDetail = Pick<DubbingArtist, "id" | "firstName" | "lastName" | "imagePublicId">;

export async function generateMetadata(
  { params }: ProjectDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { 
      title: true, 
      description: true, 
      coverImagePublicId: true
    },
  });

  if (!project) {
    return { title: 'Proje Bulunamadı | Prestij Dublaj' };
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let ogImageUrl: string | undefined = undefined;

  if (project.coverImagePublicId && cloudName) {
    ogImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,g_auto,f_auto,q_auto/${project.coverImagePublicId}`;
  }

  return {
    title: `${project.title} | Prestij Dublaj`,
    description: project.description?.substring(0, 160) || `Prestij Dublaj ekibinin ${project.title} projesi detayları.`,
    openGraph: {
      title: `${project.title} | Prestij Dublaj`,
      description: project.description?.substring(0, 160) || `Prestij Dublaj ekibinin ${project.title} projesi detayları.`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: project.title }] : [],
    },
  };
}


export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const slug = params.slug;
  const session = await getServerSession(authOptions); // Kullanıcı session'ını al

  const project = await prisma.project.findUnique({
    where: {
        slug: slug,
        isPublished: true,
    },
    include: {
      assignments: {
        orderBy: { role: 'asc' },
        select: {
          role: true,
          artist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imagePublicId: true,
            }
          }
        }
      },
      // Sayaçlar zaten modelde var, direkt kullanacağız
    }
  });

  if (!project) {
    notFound();
  }

  // YENİ: Kullanıcının bu projeyle etkileşimlerini çek
  let userInitialInteraction: ProjectInteractionButtonsProps['userInitialInteraction'] = {
    liked: false,
    disliked: false,
    favorited: false,
  };

  if (session?.user?.id) {
    const userId = parseInt(session.user.id);
    const [likedEntry, dislikedEntry, favoritedEntry] = await Promise.all([
      prisma.projectLike.findUnique({ where: { userId_projectId: { userId, projectId: project.id } } }),
      prisma.projectDislike.findUnique({ where: { userId_projectId: { userId, projectId: project.id } } }),
      prisma.projectFavorite.findUnique({ where: { userId_projectId: { userId, projectId: project.id } } }),
    ]);
    userInitialInteraction = {
      liked: !!likedEntry,
      disliked: !!dislikedEntry,
      favorited: !!favoritedEntry,
    };
  }

  const formatRole = (role: RoleInProject | string) => {
      return role.toString().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const groupedAssignments = project.assignments.reduce((acc, assignment) => {
    const roleKey = assignment.role.toString();
    if (!acc[roleKey]) {
        acc[roleKey] = [];
    }
    acc[roleKey].push(assignment.artist as ArtistForProjectDetail); 
    return acc;
  }, {} as Record<string, ArtistForProjectDetail[]>);

  // Sayfa içi sayaçlar için ID'ler
  const likeCounterId = `project-${project.id}-like-count`;
  const dislikeCounterId = `project-${project.id}-dislike-count`;
  const favoriteCounterId = `project-${project.id}-favorite-count`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 md:mb-12 text-center">
        {/* ... (Kapak resmi ve başlık kısmı aynı kalabilir) ... */}
        <div className="mb-6 inline-block max-w-4xl w-full">
          <ProjectDetailCover 
            publicId={project.coverImagePublicId} 
            altText={`${project.title} Kapak Resmi`}
          />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {project.title}
          </h1>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            <span>Tür: {project.type === 'oyun' ? 'Oyun' : 'Anime'}</span>
            {project.releaseDate && (
              <>
                {' | Yayın Tarihi: '}
                {format(new Date(project.releaseDate), 'dd MMMM yyyy', { locale: tr })} 
              </>
            )}
          </div>
          {/* Sayaçları burada gösterelim */}
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div>👍 <span id={likeCounterId}>{project.likeCount.toLocaleString('tr-TR')}</span></div>
            <div>👎 <span id={dislikeCounterId}>{project.dislikeCount.toLocaleString('tr-TR')}</span></div>
            <div>❤️ <span id={favoriteCounterId}>{project.favoriteCount.toLocaleString('tr-TR')}</span></div>
          </div>
        </div>
      </div>

      {/* YENİ: Etkileşim Butonları */}
      <ProjectInteractionButtons
        projectId={project.id}
        initialLikeCount={project.likeCount}
        initialDislikeCount={project.dislikeCount}
        initialFavoriteCount={project.favoriteCount}
        userInitialInteraction={userInitialInteraction}
        isUserLoggedIn={!!session?.user?.id} // isUserLoggedIn prop'unu ekledik
      />

      {project.description && (
        // ... (Açıklama kısmı aynı kalabilir) ...
        <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-4xl mx-auto mb-10 md:mb-16 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-100">Açıklama</h2>
          <div dangerouslySetInnerHTML={{ __html: project.description.replace(/\n/g, '<br />') }} className="text-gray-700 dark:text-gray-300" />
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* ... (Katkıda Bulunanlar kısmı aynı kalabilir) ... */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-6 md:mb-8 text-gray-800 dark:text-gray-200">
          Projeye Katkıda Bulunanlar
        </h2>
        {Object.keys(groupedAssignments).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedAssignments).map(([role, artistsArray]) => (
              <div key={role}>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 border-b border-gray-300 dark:border-gray-700 pb-2 text-indigo-600 dark:text-indigo-400">
                  {formatRole(role)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {artistsArray.map((artist) => (
                    <Link key={artist.id} href={`/sanatcilar/${artist.id}`} className="block group text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-3 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 group-hover:border-indigo-500 flex items-center justify-center">
                        <ArtistAvatar 
                          publicId={artist.imagePublicId}
                          altText={`${artist.firstName} ${artist.lastName}`}
                          size={96}
                        />
                      </div>
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {artist.firstName} {artist.lastName}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">Bu projeye henüz kimse atanmamış.</p>
        )}
      </div>
    </div>
  );
}