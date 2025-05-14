// src/components/ArtistAvatar.tsx
'use client';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';

interface ArtistAvatarProps {
  publicId: string | null;
  altText: string;
  size?: number;
  className?: string;
}
export default function ArtistAvatar({ publicId, altText, size = 96, className }: ArtistAvatarProps) {
  if (!publicId) {
    return (
      <UserCircleIcon 
        className={`h-full w-full text-gray-400 dark:text-gray-500 p-1 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <CldImage
      src={publicId} alt={altText} width={size} height={size} crop="fill"
      gravity="face" format="auto" quality="auto"
      className={`object-cover w-full h-full rounded-full ${className}`}
    />
  );
}