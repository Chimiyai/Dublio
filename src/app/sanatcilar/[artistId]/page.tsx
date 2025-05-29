// src/app/sanatcilar/[artistId]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Prisma, RoleInProject } from '@prisma/client';
import { formatProjectRole } from '@/lib/utils';
import ProjectCardCover from '@/components/ProjectCardCover'; // Proje kartları için
import ArtistAvatar from '@/components/ArtistAvatar'; // Sanatçı avatarı için
import { Metadata } from 'next';
import { FilmIcon, BriefcaseIcon } from 'lucide-react';


type ArtistWithAssignments = Prisma.DubbingArtistGetPayload<{
  include: {
    assignments: {
      include: {
        project: {
          select: {
            id: true;
            title: true;
            slug: true;
            type: true;
            coverImagePublicId: true; // Sadece publicId
            releaseDate: true;
          };
        };
      };
    };
  };
}>;

type ProjectAssignmentInArtist = ArtistWithAssignments['assignments'][number];

async function getArtistDetails(artistId: string): Promise<ArtistWithAssignments | null> {
  const numericArtistId = parseInt(artistId, 10);
  if (isNaN(numericArtistId)) return null;

  return await prisma.dubbingArtist.findUnique({
    where: { id: numericArtistId },
    include: {
      assignments: {
        orderBy: { project: { releaseDate: 'desc' } },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              coverImagePublicId: true, // Sadece publicId
              releaseDate: true,
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { artistId: string } }): Promise<Metadata> {
  const artist = await getArtistDetails(params.artistId);
  if (!artist) return { title: 'Sanatçı Bulunamadı' };
  return {
    title: `${artist.firstName} ${artist.lastName} - Prestij Dublaj`,
    description: artist.bio || `Prestij Dublaj ekibinden ${artist.firstName} ${artist.lastName}'in katkıda bulunduğu projeler.`,
    // OpenGraph resmi için de sanatçının imagePublicId'sini kullanabiliriz
    // ...
  };
}

export default async function ArtistDetailPage({ params }: { params: { artistId: string } }) {
  const artist = await getArtistDetails(params.artistId);
  if (!artist) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start mb-10 md:mb-12 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-indigo-500 dark:border-indigo-400 mb-4 md:mb-0 md:mr-8 flex-shrink-0">
          <ArtistAvatar 
            publicId={artist.imagePublicId} 
            altText={`${artist.firstName} ${artist.lastName}`}
            size={192} // md:w-48 md:h-48 için
          />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {artist.firstName} {artist.lastName}
          </h1>
          {artist.bio && (
            <div className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-xl">
              {artist.bio}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6 md:mb-8 text-gray-800 dark:text-gray-200">
          Katkıda Bulunduğu Projeler
        </h2>
        {artist.assignments && artist.assignments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {artist.assignments.map(({ project, role }: ProjectAssignmentInArtist) => (
              <Link
                href={`/projeler/${project.slug}`}
                key={`${project.id}-${role}`}
                className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl overflow-hidden transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                <div className="relative w-full aspect-[4/3]">
                  <ProjectCardCover
                    publicId={project.coverImagePublicId}
                    altText={`${project.title} Kapak Resmi`}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {project.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {project.type === 'oyun' ? 'Oyun' : 'Anime'}
                    {/* <<=== DEĞİŞİKLİK BURADA ===>> */}
                    {project.releaseDate
                      ? ` - ${format(new Date(project.releaseDate), 'yyyy', { locale: tr })}`
                      : ' - Tarih Belirtilmemiş'}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                      <BriefcaseIcon className="h-3 w-3 mr-1" />
                      {formatProjectRole(role)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            Bu sanatçının henüz katkıda bulunduğu bir proje bulunmuyor.
          </p>
        )}
      </div>
    </div>
  );
}