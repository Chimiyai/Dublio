// src/app/sanatcilar/[artistId]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { FilmIcon, BriefcaseIcon, UserCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Prisma } from '@prisma/client';
import { formatProjectRole } from '@/lib/utils';
import { RoleInProject } from '@prisma/client';

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
            coverImage: true; // Bu tam URL olmalı
            // coverImagePublicId: true; // İstersek bunu da çekebiliriz
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
  if (isNaN(numericArtistId)) {
    console.error(`Geçersiz artistId: ${artistId}`);
    return null;
  }
  try {
    const artist = await prisma.dubbingArtist.findUnique({
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
                coverImage: true, // Tam URL'i çekiyoruz
                releaseDate: true,
              },
            },
          },
        },
      },
    });
    return artist; // Prisma.DubbingArtistGetPayload tipi doğru olmalı
  } catch (error) {
    console.error(`Sanatçı ${artistId} getirilirken hata:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { artistId: string } }) {
  const artist = await getArtistDetails(params.artistId);
  if (!artist) return { title: 'Sanatçı Bulunamadı' };
  return {
    title: `${artist.firstName} ${artist.lastName} - Prestij Dublaj`,
    description: artist.bio || `Prestij Dublaj ekibinden ${artist.firstName} ${artist.lastName}'in katkıda bulunduğu projeler.`,
  };
}

export default async function ArtistDetailPage({ params }: { params: { artistId: string } }) {
  const artist = await getArtistDetails(params.artistId);

  if (!artist) {
    notFound();
  }

  // artist.imageUrl veritabanında tam URL tuttuğu için direkt kullanıyoruz.
  const artistImageUrl = artist.imageUrl;

  // getCloudinaryImageUrl fonksiyonuna artık ihtiyacımız YOK,
  // çünkü hem sanatçı hem de proje resimleri için tam URL'leri kullanıyoruz.
  // Bu fonksiyonu silebilir veya yorum satırı yapabiliriz.
  /*
  const getCloudinaryImageUrl = (publicId: string | null | undefined, options: string = 'c_fill,w_400,h_400,g_face') => {
    // ...
  };
  */

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sanatçı Bilgileri */}
      <div className="flex flex-col md:flex-row items-center md:items-start mb-10 md:mb-12 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div 
  className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-indigo-500 dark:border-indigo-400 mb-4 md:mb-0 md:mr-8 flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700" 
  // Eğer resim yüklenmezse veya küçük kalırsa diye bg ve flex center eklendi
>
  {artistImageUrl ? (
    <Image
      src={artistImageUrl}
      alt={`${artist.firstName} ${artist.lastName}`}
      // fill kaldırıldı
      width={192} // md:w-48 için (48 * 4 = 192px Tailwind varsayılan ölçeğinde)
      height={192} // md:h-48 için
      className="object-cover rounded-full" // Resmin kendisini de yuvarlak yapabiliriz
      priority
    />
  ) : (
    <UserCircleIcon className="h-24 w-24 md:h-32 md:h-32 text-gray-400 dark:text-gray-500" />
  )}
</div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {artist.firstName} {artist.lastName}
          </h1>
          {artist.bio && (
            <div
              className="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-xl"
              // Eğer bio düz metin ise: {artist.bio}
              // Eğer bio HTML ise ve güvenli ise: dangerouslySetInnerHTML={{ __html: artist.bio }}
            >
              {artist.bio}
            </div>
          )}
        </div>
      </div>

      {/* Katkıda Bulunduğu Projeler */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6 md:mb-8 text-gray-800 dark:text-gray-200">
          Katkıda Bulunduğu Projeler
        </h2>
        {artist.assignments && artist.assignments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {artist.assignments.map(({ project, role }: ProjectAssignmentInArtist) => {
              // project.coverImage veritabanında tam URL tuttuğu için direkt kullanıyoruz.
              const projectCoverUrl = project.coverImage;

              return (
                <Link
                  href={`/projeler/${project.slug}`}
                  key={`${project.id}-${role}`}
                  className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl overflow-hidden transition duration-300 ease-in-out transform hover:-translate-y-1"
                >
                  <div 
  className="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden flex items-center justify-center"
  // 'relative' sınıfı artık Image için zorunlu değil, ebeveynin position'ı default (static) olabilir.
  // Ama eğer CldImage veya başka bir absolute konumlandırılmış eleman eklenirse diye kalabilir.
  // 'flex items-center justify-center' eklendi, eğer resim alanı tam kaplamazsa ortalamak için.
>
  {projectCoverUrl ? (
    <Image
      src={projectCoverUrl}
      alt={`${project.title} Kapak Resmi`}
      // fill kaldırıldı
      // Örnek olarak büyük bir width/height verelim. Bu değerler resminizin
      // tipik en-boy oranına (4:3) yakın olmalı. Örneğin, 800x600, 1200x900 vb.
      // Bu, next/image'in optimize edeceği maksimum boyut değil, sadece layout için bir ipucu.
      width={800} // Örnek bir genişlik
      height={600} // Örnek bir yükseklik (800 * 3/4 = 600)
      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
      // 'w-full h-full' sınıfları, Image'in ebeveyninin (aspect-ratio'lu div)
      // genişlik ve yüksekliğini almasını sağlar.
      // 'object-cover' ise oranı koruyarak bu alanı doldurur.
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // sizes prop'u hala önemli
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <FilmIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
    </div>
  )}
</div>
                  <div className="p-4">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {project.type === 'game' ? 'Oyun' : 'Anime'} - {format(new Date(project.releaseDate), 'yyyy', { locale: tr })}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                      <BriefcaseIcon className="h-3 w-3 mr-1" />
                      {formatProjectRole(role)} {/* role zaten RoleInProject tipinde olmalı */}
                    </span>
                  </div>
                </Link>
              );
            })}
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