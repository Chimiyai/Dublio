// src/app/sanatcilar/[artistId]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Prisma, RoleInProject, DubbingArtist } from '@prisma/client';
import { formatProjectRole } from '@/lib/utils';
import ProjectCardCover from '@/components/ProjectCardCover';
import ArtistAvatar from '@/components/ArtistAvatar';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import ArtistInteractionButtons from '@/components/artists/ArtistInteractionButtons';

// --- TİP TANIMLARI ---
interface AssignmentWithDetailsAndProject extends Prisma.ProjectAssignmentGetPayload<{
  include: {
    project: {
      select: {
        id: true; title: true; slug: true; type: true;
        coverImagePublicId: true; releaseDate: true;
      };
    };
    voiceRoles: { 
      select: { character: { select: { id: true; name: true; } } }
    }
  }
}> {}

// Bu tip, getArtistDetails'ten dönen ve sayfada kullanılacak tam veri yapısını temsil eder.
// DubbingArtist'in tüm alanlarını ve eklediğimiz custom alanları içerir.
interface ArtistPageData extends DubbingArtist {
  assignments: AssignmentWithDetailsAndProject[];
  userLiked: boolean;
  userFavorited: boolean;
  // _count: { // Prisma _count'u bu şekilde ekler
  //   likes: number;
  //   favoritedBy: number;
  // };
  // Prisma'dan gelen _count objesi zaten DubbingArtist tipine dahil olabilir (include ile)
  // veya biz likeCount ve favoriteCount'u direkt DubbingArtist modeline eklemiştik.
}

interface SanatciPageServerProps {
  params: Promise<{ artistId: string }>;
  // Bu sayfada searchParams kullanılmıyor gibi, o yüzden eklemeyebiliriz.
  // searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getArtistDetails(artistIdParam: string, currentUserId?: number): Promise<ArtistPageData | null> {
  const artistId = parseInt(artistIdParam, 10);
  if (isNaN(artistId)) {
    console.error("getArtistDetails: Geçersiz artistIdParam:", artistIdParam);
    return null;
  }

  const artistData = await prisma.dubbingArtist.findUnique({
    where: { id: artistId },
    include: {
      assignments: {
        orderBy: { project: { releaseDate: 'desc' } },
        include: {
          project: {
            select: {
              id: true, title: true, slug: true, type: true,
              coverImagePublicId: true, releaseDate: true,
            },
          },
          voiceRoles: {
            orderBy: {character: {name: 'asc'}},
            select: {
              character: { select: { id: true, name: true } }
            }
          }
        },
      },
      // likeCount ve favoriteCount DubbingArtist modelinde zaten var olmalı
    },
  });

  if (!artistData) return null;

  let userLiked = false;
  let userFavorited = false;

  if (currentUserId) {
    const like = await prisma.dubbingArtistLike.findUnique({
      where: { userId_artistId: { userId: currentUserId, artistId: artistData.id } },
    });
    userLiked = !!like;

    const favorite = await prisma.dubbingArtistFavorite.findUnique({
      where: { userId_artistId: { userId: currentUserId, artistId: artistData.id } },
    });
    userFavorited = !!favorite;
  }
  
  // ArtistPageData tipine cast ederken eksik alan olmamalı
  return { 
    ...artistData, 
    assignments: artistData.assignments as AssignmentWithDetailsAndProject[],
    userLiked, 
    userFavorited,
    // likeCount ve favoriteCount artistData'dan direkt gelmeli (modelde @default(0) vardı)
  } as ArtistPageData; // Son cast
}


export async function generateMetadata(
  { params }: SanatciPageServerProps // Güncellenmiş Props tipi
): Promise<Metadata> {
  const resolvedParams = await params; // params'ı çöz
  const artistIdString = resolvedParams.artistId;

  if (!artistIdString || typeof artistIdString !== 'string' || artistIdString.trim() === "") {
    return { title: 'Sanatçı Bulunamadı | Dublio' };
  }
  // getArtistDetails zaten string alıyor, parseInt'i orada yapıyor.
  const artist = await getArtistDetails(artistIdString); 
  if (!artist) return { title: 'Sanatçı Bulunamadı | Dublio' };
  return {
    title: `${artist.firstName} ${artist.lastName} - Dublio Dublaj`,
    description: artist.bio || `Dublio Dublaj ekibinden ${artist.firstName} ${artist.lastName}'in katkıda bulunduğu projeler.`,
  };
}

export default async function ArtistDetailPage(
  { params }: SanatciPageServerProps // Güncellenmiş Props tipi
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : undefined;

  const resolvedParams = await params; // params'ı çöz
  const artistIdString = resolvedParams.artistId;

  if (!artistIdString || typeof artistIdString !== 'string' || artistIdString.trim() === "") {
    console.error("ArtistDetailPage: Eksik veya geçersiz artistId parametresi.");
    notFound();
  }

  const artist = await getArtistDetails(artistIdString, currentUserId);
  
  if (!artist) {
    notFound();
  }

  // Projeleri gruplama (bu mantık doğruydu)
  const groupedProjects = new Map<number, {
    project: AssignmentWithDetailsAndProject['project'];
    rolesAndCharacters: Array<{ role: RoleInProject; characters?: string[] }>;
  }>();

  if (artist.assignments) {
    artist.assignments.forEach((assignment) => {
      if (!assignment.project) return;
      if (!groupedProjects.has(assignment.project.id)) {
        groupedProjects.set(assignment.project.id, {
          project: assignment.project,
          rolesAndCharacters: [],
        });
      }
      const projectEntry = groupedProjects.get(assignment.project.id)!;
      const roleInfo: { role: RoleInProject; characters?: string[] } = { role: assignment.role };
      if (assignment.role === RoleInProject.VOICE_ACTOR && assignment.voiceRoles && assignment.voiceRoles.length > 0) {
        roleInfo.characters = assignment.voiceRoles.map(vr => vr.character.name);
      }
      projectEntry.rolesAndCharacters.push(roleInfo);
    });
  }
  const uniqueProjectsToDisplay = Array.from(groupedProjects.values());

  return (
    <div className="bg-dublio-dark-900 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:items-start mb-10 md:mb-12 bg-dublio-sidebar-bg p-6 sm:p-8 rounded-xl shadow-2xl">
          <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full mr-[20px]">
      <ArtistAvatar 
        publicId={artist.imagePublicId} // <<== BU DEĞER null VEYA UNDEFINED MI?
        altText={`${artist.firstName} ${artist.lastName}`}
        size={192} 
      />
    </div>
          <div className="text-center md:text-left flex-grow">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1">
              {artist.firstName} {artist.lastName}
            </h1>
            <ArtistInteractionButtons
              artistId={artist.id}
              initialLikeCount={artist.likeCount || 0} // artist.likeCount undefined ise 0 ata
              initialFavoriteCount={artist.favoriteCount || 0} // artist.favoriteCount undefined ise 0 ata
              initialUserLiked={artist.userLiked || false} // undefined ise false ata
              initialUserFavorited={artist.userFavorited || false} // undefined ise false ata
            />
            {artist.bio && (
              <div className="mt-4 text-dublio-text-secondary prose prose-sm dark:prose-invert max-w-none md:max-w-xl leading-relaxed">
                <p className="whitespace-pre-line">{artist.bio}</p>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-full mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-8 md:mb-10 text-white">
            Katkıda Bulunduğu Projeler
          </h2>
          {uniqueProjectsToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {uniqueProjectsToDisplay.map(({ project, rolesAndCharacters }) => (
                <Link
                  href={project.type === 'oyun' ? `/oyunlar/${project.slug}` : `/animeler/${project.slug}`}
                  key={project.id}
                  className="group block bg-dublio-card-bg rounded-xl shadow-lg hover:shadow-dublio-500/20 overflow-hidden transition-all duration-300 ease-out transform hover:-translate-y-1"
                >
                  <div className="relative w-full aspect-[3/4]">
                    <ProjectCardCover
                      publicId={project.coverImagePublicId}
                      altText={`${project.title} Kapak Resmi`}
                    />
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-base font-semibold text-dublio-text-primary mb-1 group-hover:text-dublio-400 transition-colors truncate" title={project.title}>
                      {project.title}
                    </h3>
                    <p className="text-xs text-dublio-text-muted mb-1.5">
                      {project.type === 'oyun' ? 'Oyun' : 'Anime'}
                      {project.releaseDate
                        ? ` - ${format(new Date(project.releaseDate), 'yyyy')}`
                        : ''}
                    </p>
                    <div className="text-2xs space-y-0.5">
                      {rolesAndCharacters.map((rc, index) => (
                        <div key={index} className="flex items-center">
                          <span className="inline-block px-1.5 py-0.5 rounded-sm bg-dublio-input-bg text-dublio-text-secondary mr-1.5 leading-none">
                            {formatProjectRole(rc.role)}
                          </span>
                          {rc.characters && rc.characters.length > 0 && (
                            <span className="text-purple-400 truncate" title={rc.characters.join(', ')}>
                              ({rc.characters.join(', ')})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : ( <p className="text-center text-dublio-text-secondary py-10">
              Bu sanatçının henüz katkıda bulunduğu bir proje bulunmuyor.
            </p> )}
        </div>
      </div>
    </div>
  );
}