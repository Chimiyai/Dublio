// src/app/projeler/[slug]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import { UserCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { RoleInProject } from '@prisma/client'; // Prisma Enum

interface ProjectDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  { params }: ProjectDetailPageProps, // Standart params alımı
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { title: true, description: true, coverImage: true, coverImagePublicId: true },
  });

  if (!project) {
    return { title: 'Proje Bulunamadı | Prestij Dublaj' };
  }

  // Cloudinary URL'sini oluştururken environment variable'ı kontrol et
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let imageUrl: string | undefined = undefined;

  if (project.coverImagePublicId && cloudName) {
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_1200,h_630,g_auto/${project.coverImagePublicId}`;
  } else if (project.coverImage) {
    imageUrl = project.coverImage;
  }

  return {
    title: `${project.title} | Prestij Dublaj`,
    description: project.description?.substring(0, 160) || `Prestij Dublaj ekibinin ${project.title} projesi detayları.`,
    openGraph: {
      title: `${project.title} | Prestij Dublaj`,
      description: project.description?.substring(0, 160) || `Prestij Dublaj ekibinin ${project.title} projesi detayları.`,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) { // Standart params alımı
  const slug = params.slug;

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
              imageUrl: true,
            }
          }
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  const formatRole = (role: RoleInProject | string) => {
      return role.toString().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const groupedAssignments = project.assignments.reduce((acc, assignment) => {
        const roleKey = assignment.role.toString();
        if (!acc[roleKey]) {
            acc[roleKey] = [];
        }
        acc[roleKey].push(assignment.artist);
        return acc;
    }, {} as Record<string, typeof project.assignments[0]['artist'][]>);

  // Cloudinary URL'sini oluştururken environment variable'ı kontrol et
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  let coverImageUrlForRender: string | undefined | null = null;

  if (project.coverImagePublicId && cloudName) {
    coverImageUrlForRender = `https://res.cloudinary.com/${cloudName}/image/upload/${project.coverImagePublicId}`;
  } else if (project.coverImage) {
    coverImageUrlForRender = project.coverImage;
  }


  return (
    <div className="container mx-auto px-4 py-8"> {/* Ana container */}

      {/* --- Proje Üst Bilgisi --- */}
      <div className="mb-8 md:mb-12 text-center"> {/* Resim ve başlığı ortalamak için */}
        
        {/* Kapak Resmi */}
        {coverImageUrlForRender ? (
          <div className="mb-6 inline-block max-w-full"> {/* Resmi sarmala ve max genişlik ver */}
            <Image
              src={coverImageUrlForRender}
              alt={`${project.title} Kapak Resmi`}
              width={1000} // Örnek bir maksimum genişlik
              height={562} // width'e göre 16:9 oranı (1000 * 9 / 16)
                           // Bu değerler resmin orijinal oranına göre ayarlanmalı veya
                           // resmin en boy oranını koruyarak sadece genişliği kısıtlayabiliriz.
              className="object-contain rounded-lg shadow-lg max-h-[60vh]" // object-contain oranı korur, max-h yüksekliği sınırlar
              priority
              // style={{ width: 'auto', height: 'auto' }} // Eğer oranın korunmasını istiyorsak
            />
          </div>
        ) : (
          <div className="w-full h-60 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg shadow-lg mb-6">
            <PhotoIcon className="h-20 w-20 text-gray-400 dark:text-gray-500" />
          </div>
        )}

        {/* Başlık ve Proje Bilgileri (Resmin ALTINDA) */}
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {project.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Tür: {project.type === 'game' ? 'Oyun' : 'Anime'} | Yayın Tarihi: {format(new Date(project.releaseDate), 'dd MMMM yyyy', { locale: tr })}
          </p>
        </div>
      </div>
      {/* ------------------------ */}

      {/* Proje Açıklaması */}
      {project.description && (
        <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-4xl mx-auto mb-10 md:mb-16 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-100">Açıklama</h2>
          <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
        </div>
      )}

      {/* Katkıda Bulunanlar */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-6 md:mb-8 text-gray-800 dark:text-gray-200">
          Projeye Katkıda Bulunanlar
        </h2>
        {Object.keys(groupedAssignments).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedAssignments).map(([role, artists]) => (
              <div key={role}>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 border-b border-gray-300 dark:border-gray-700 pb-2 text-indigo-600 dark:text-indigo-400">
                  {formatRole(role)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {artists.map((artist) => (
                    <Link key={artist.id} href={`/sanatcilar/${artist.id}`} className="block group text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105">
                       <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-3">
                           {artist.imageUrl ? (
                                <Image
                                    src={artist.imageUrl}
                                    alt={`${artist.firstName} ${artist.lastName}`}
                                    fill
                                    className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-indigo-500"
                                />
                           ) : (
                                <UserCircleIcon className="h-full w-full text-gray-400 dark:text-gray-500" />
                           )}
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