// src/components/ProjectCardCover.tsx
'use client';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';

interface ProjectCardCoverProps {
  publicId: string | null;
  altText: string;
  className?: string;
}
export default function ProjectCardCover({ publicId, altText, className }: ProjectCardCoverProps) {
  if (!publicId) {
    return (
      <div className={`w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }
  return (
    <CldImage
      src={publicId} alt={altText} width={400} height={300} crop="fill"
      gravity="auto" format="auto" quality="auto"
      className={`object-cover w-full h-full ${className}`}
    />
  );
}