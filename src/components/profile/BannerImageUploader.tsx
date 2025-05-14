// src/components/profile/BannerImageUploader.tsx
'use client';

import ImageUploader from '@/components/admin/ImageUploader'; // Genel ImageUploader

interface BannerImageUploaderProps {
  currentImagePublicId: string | null; // Bu prop'u bekliyoruz
  onFileSelect: (file: File | null) => void;
}

export default function BannerImageUploader({
  currentImagePublicId,
  onFileSelect,
}: BannerImageUploaderProps) {
  return (
    <ImageUploader
      currentImagePublicId={currentImagePublicId}
      onFileSelect={onFileSelect}
      aspectRatio="aspect-[16/5]" // Banner için uygun bir oran (veya aspect-w-16 aspect-h-5 class'ı)
      label="Banner Resmi"
      maxFileSizeMB={5} // Banner için boyut
    />
  );
}