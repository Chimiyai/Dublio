// src/components/ProjectCoverImageClient.tsx
'use client';

import { PhotoIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';

interface ProjectCoverImageProps {
  publicId: string | null;
  altText: string;
  className?: string; // İsteğe bağlı ek class'lar
}

export default function ProjectCoverImageClient({ publicId, altText, className }: ProjectCoverImageProps) {
  if (!publicId) {
    return (
      <div className={`w-full h-60 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg shadow-lg mb-6 ${className}`}>
        <PhotoIcon className="h-20 w-20 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <CldImage
      src={publicId}
      alt={altText}
      width={1000}
      height={562}
      crop="fill"
      gravity="auto"
      format="auto"
      quality="auto"
      className={`object-contain rounded-lg shadow-lg max-h-[60vh] ${className}`}
      priority
    />
  );
}