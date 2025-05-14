// src/components/admin/AdminArtistAvatar.tsx
'use client';

import { UserCircleIcon } from '@heroicons/react/24/solid'; // Veya outline, hangisini tercih edersen
import { CldImage } from 'next-cloudinary';

interface AdminArtistAvatarProps {
  publicId: string | null;
  altText: string;
  size?: number;
  className?: string;
}

export default function AdminArtistAvatar({ publicId, altText, size = 40, className = "rounded-full object-cover" }: AdminArtistAvatarProps) {
  if (!publicId) {
    return (
      <UserCircleIcon 
        className={`h-full w-full text-gray-400 dark:text-gray-500 ${className}`} // className'i buraya da ekle
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <CldImage
      src={publicId} // Veritabanından gelen uzantısız public ID
      alt={altText}
      width={size} // Dinamik boyut
      height={size}
      crop="fill"
      gravity="face" // Yüz odaklı kırpma
      format="auto"
      quality="auto"
      // CldImage sarmalayıcısına değil, içindeki img'e etki eder.
      // className prop'u CldImage'in en dış sarmalayıcısını etkiler.
      // Eğer doğrudan img etiketine class vermek istersen,
      // CldImage'in ürettiği HTML'i inceleyip ona göre bir yol izlemek gerekebilir
      // veya CldImage'in kendi styling/className mekanizmalarını kullanmak.
      // Şimdilik direkt CldImage'e className veriyoruz.
      className={`${className} w-full h-full`} // w-full h-full ile ebeveyni doldurmasını sağla
    />
  );
}