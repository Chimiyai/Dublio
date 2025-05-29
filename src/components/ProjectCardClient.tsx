// src/components/ProjectCardClient.tsx
'use client'; // Client Component olduğunu belirt

import Link from 'next/link';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CldImage } from 'next-cloudinary';

// Ana sayfadan gelen proje tipini daraltabiliriz
interface ProjectCardProps {
  project: {
    title: string;
    slug: string;
    type: string;
    coverImagePublicId: string | null;
    releaseDate: Date;
  };
}

export default function ProjectCardClient({ project }: ProjectCardProps) {
  return (
    <Link 
      href={`/projeler/${project.slug}`} 
      key={project.slug} 
      className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl overflow-hidden transition duration-300 ease-in-out transform hover:-translate-y-1"
    >
      <div className="relative w-full aspect-[4/3]">
        {project.coverImagePublicId ? (
          <CldImage
            src={project.coverImagePublicId}
            alt={`${project.title} Kapak Resmi`}
            width={400} // Kart için uygun boyutlar
            height={300}
            crop="fill"
            gravity="auto"
            format="auto"
            quality="auto"
            className="object-cover w-full h-full"
            // loading="lazy" // CldImage zaten lazy loading yapar
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full text-white ${
            project.type === 'oyun' ? 'bg-green-600' : 'bg-purple-600'
        }`}>
            {project.type === 'oyun' ? 'Oyun' : 'Anime'}
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
  );
}