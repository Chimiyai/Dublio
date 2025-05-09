// src/app/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CldImage } from 'next-cloudinary'; // <--- CldImage İMPORTU EKLENDİ
import { Project } from '@prisma/client';

export const metadata = {
  title: 'Prestij Dublaj - Oyun ve Anime Dublaj Projeleri',
  description: 'Prestij Dublaj ekibinin en son oyun ve anime dublaj projelerini keşfedin.',
};
type HomePageProject = {
  title: string;
  slug: string;
  type: string;
  coverImage: string | null;
  coverImagePublicId: string | null; // Bunu da eklemiştik
  releaseDate: Date;
};
export default async function HomePage() {
  const publishedProjects = await prisma.project.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      releaseDate: 'desc',
    },
    select: { 
      title: true,
      slug: true,
      type: true,
      coverImage: true,
      coverImagePublicId: true, // <--- coverImagePublicId BURAYA EKLENDİ
      releaseDate: true,
    }
  })as HomePageProject[];;
  console.log("Ana Sayfa Projeleri:", JSON.stringify(publishedProjects, null, 2)); // Veriyi detaylı gör

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* ... (Hero Section aynı) ... */}
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Prestij Dublaj Projeleri
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Tutkuyla hazırladığımız oyun ve anime dublaj çalışmalarımızı keşfedin. En yeni projelerimiz aşağıda!
        </p>
      </section>

      <section>
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8 text-gray-800 dark:text-gray-200">
          Son Projeler
        </h2>
        
        {publishedProjects.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            Henüz yayınlanmış bir proje bulunmuyor. Çok yakında!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {publishedProjects.map((project) => (
              <Link 
                href={`/projeler/${project.slug}`} 
                key={project.slug} 
                className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl overflow-hidden transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
<div className="relative w-full aspect-[4/3]">
    {project.coverImage ? (
        <img 
            src={project.coverImage} 
            alt={`${project.title} Kapak Resmi`}
            className="object-cover w-full h-full"
            loading="lazy"
            style={{ imageRendering: 'pixelated' }} // Test için bulanıklığı önle
        />
    ) : (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
        </div>
    )}
                   <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full text-white ${
                       project.type === 'game' ? 'bg-green-600' : 'bg-purple-600'
                   }`}>
                       {project.type === 'game' ? 'Oyun' : 'Anime'}
                   </span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {project.title}
                  </h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400">
                       Yayın: {format(new Date(project.releaseDate), 'dd MMM yyyy', { locale: tr })}
                   </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}