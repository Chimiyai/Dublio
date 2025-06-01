// src/app/projeler/[slug]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next'; // ResolvingMetadata'yı da import et (generateMetadata için)
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { RoleInProject, DubbingArtist, Project } from '@prisma/client'; // Project tipini de alalım
import { formatProjectRole } from '@/lib/utils';
import ProjectDetailCover from '@/components/ProjectDetailCover';
import ArtistAvatar from '@/components/ArtistAvatar';
import { ProjectInteractionButtonsProps } from '@/components/project/ProjectInteractionButtons'; // Bu tipi export etmiştik
import ProjectInteractionButtons from '@/components/project/ProjectInteractionButtons';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

type ArtistForProjectDetail = Pick<DubbingArtist, "id" | "firstName" | "lastName" | "imagePublicId">;

interface ProjectPageServerProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams da Promise olarak tanımlandı
}

// generateMetadata için props tipi (ResolvingMetadata ikinci parametre olarak kalabilir)
export async function generateMetadata(
  { params }: ProjectPageServerProps, // Güncellenmiş Props tipi
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  // const resolvedSearchParams = searchParams ? await searchParams : {}; // Metadata için gerekirse

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { 
      title: true, 
      description: true, 
      coverImagePublicId: true
    },
  });

  if (!project) {
    return { title: 'Proje Bulunamadı | PrestiJ Dublaj' };
  }

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let ogImageUrl: string | undefined = undefined;

  if (project.coverImagePublicId && cloudName) {
    ogImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,g_auto,f_auto,q_auto/${project.coverImagePublicId}`;
  }

  return {
    title: `${project.title} | PrestiJ DublaJ`, // Dublaj küçük j olmalıydı sanırım
    description: project.description?.substring(0, 160) || `PrestiJ Dublaj ekibinin ${project.title} projesi detayları.`,
    openGraph: {
      title: `${project.title} | PrestiJ DublaJ`,
      description: project.description?.substring(0, 160) || `PrestiJ Dublaj ekibinin ${project.title} projesi detayları.`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630, alt: project.title }] : [],
    },
  };
}

// ProjectDetailPage için Props tipi (searchParams yoksa sadece params)
interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams?: { [key: string]: string | string[] | undefined };
}


export default async function ProjectDetailPage(
  { params, searchParams }: ProjectPageServerProps // Güncellenmiş Props tipi
) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  // searchParams'ı çöz
  const resolvedSearchParams = searchParams ? await searchParams : {};
  // const activeTabFromSearchParams = resolvedSearchParams?.tab as string | undefined; // Eğer tab kullanıyorsanız

  const session = await getServerSession(authOptions);

  // Proje verisini çek (Bu kısım doğru görünüyor)
  const projectData = await prisma.project.findUnique({ // projectData olarak adlandıralım
    where: {
        slug: slug,
        isPublished: true, // Sadece yayınlanmış projeler
    },
    include: {
      assignments: {
        orderBy: { artist: {lastName: 'asc'} }, // Daha iyi sıralama için
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
          // voiceRoles'i de burada çekebiliriz eğer proje detayında göstereceksek
          // voiceRoles: { select: { character: {select: { name: true }}}}
        }
      },
      // Like, dislike, favorite count'ları direkt Project modelinden geliyor
    }
  });

  if (!projectData) { // projectData olarak kontrol et
    notFound();
  }
  
  // project değişkenini projectData'dan oluşturalım (tip uyumu için)
  // Bu adım, eğer ProjectDetailPage'in beklediği tip ile Prisma'dan dönen tip
  // arasında fark varsa gereklidir. Şimdilik doğrudan projectData'yı kullanabiliriz
  // veya ProjectInteractionButtonsProps için gereken alanları map'leyebiliriz.
  // Benzer şekilde, groupedAssignments projectData.assignments kullanmalı.

  let userInitialInteraction: ProjectInteractionButtonsProps['userInitialInteraction'] = {
    liked: false,
    disliked: false,
    favorited: false,
  };

  if (session?.user?.id) {
    const userId = parseInt(session.user.id);
    const [likedEntry, dislikedEntry, favoritedEntry] = await Promise.all([
      prisma.projectLike.findUnique({ where: { userId_projectId: { userId, projectId: projectData.id } } }), // projectData.id
      prisma.projectDislike.findUnique({ where: { userId_projectId: { userId, projectId: projectData.id } } }), // projectData.id
      prisma.projectFavorite.findUnique({ where: { userId_projectId: { userId, projectId: projectData.id } } }), // projectData.id
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

  const groupedAssignments = projectData.assignments.reduce((acc, assignment) => { // projectData.assignments
    const roleKey = assignment.role.toString();
    if (!acc[roleKey]) acc[roleKey] = [];
    acc[roleKey].push(assignment.artist as ArtistForProjectDetail); 
    return acc;
  }, {} as Record<string, ArtistForProjectDetail[]>);

  const likeCounterId = `project-${projectData.id}-like-count`; // projectData.id
  const dislikeCounterId = `project-${projectData.id}-dislike-count`;
  const favoriteCounterId = `project-${projectData.id}-favorite-count`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 md:mb-12 text-center">
        <div className="mb-6 inline-block max-w-4xl w-full">
          <ProjectDetailCover 
            publicId={projectData.coverImagePublicId} // projectData
            altText={`${projectData.title} Kapak Resmi`} // projectData
          />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {projectData.title} {/* projectData */}
          </h1>
          <div className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            <span>Tür: {projectData.type === 'oyun' ? 'Oyun' : 'Anime'}</span>
            {projectData.releaseDate && (
              <>
                {' | Yayın Tarihi: '}
                {format(new Date(projectData.releaseDate), 'dd MMMM yyyy', { locale: tr })} 
              </>
            )}
          </div>
          {/* Sayaçları burada gösterelim */}
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div>👍 <span id={likeCounterId}>{projectData.likeCount.toLocaleString('tr-TR')}</span></div>
            <div>👎 <span id={dislikeCounterId}>{projectData.dislikeCount.toLocaleString('tr-TR')}</span></div>
            <div>❤️ <span id={favoriteCounterId}>{projectData.favoriteCount.toLocaleString('tr-TR')}</span></div>
          </div>
        </div>
      </div>

      <ProjectInteractionButtons
        projectId={projectData.id} // projectData
        initialLikeCount={projectData.likeCount} // projectData
        initialDislikeCount={projectData.dislikeCount} // projectData
        initialFavoriteCount={projectData.favoriteCount} // projectData
        userInitialInteraction={userInitialInteraction}
        isUserLoggedIn={!!session?.user?.id}
      />

      {projectData.description && (
        // ... (Açıklama kısmı aynı kalabilir) ...
        <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-4xl mx-auto mb-10 md:mb-16 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-100">Açıklama</h2>
          <div dangerouslySetInnerHTML={{ __html: projectData.description.replace(/\n/g, '<br />') }} className="text-gray-700 dark:text-gray-300" />
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