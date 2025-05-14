// src/components/ProjectDetailCover.tsx
'use client';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';

interface ProjectDetailCoverProps {
  publicId: string | null;
  altText: string;
}
export default function ProjectDetailCover({ publicId, altText }: ProjectDetailCoverProps) {
  if (!publicId) {
    return (
      <div className="w-full h-60 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg shadow-lg mb-6">
        <PhotoIcon className="h-20 w-20 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }
  return (
    <CldImage
      src={publicId} alt={altText} width={1000} height={562} crop="fill"
      gravity="auto" format="auto" quality="auto"
      className="object-contain rounded-lg shadow-lg max-h-[60vh]" priority
    />
  );
}