// src/components/profile/ProfileImageUploader.tsx
'use client';

import ImageUploader from '@/components/admin/ImageUploader'; // Genel ImageUploader'ı kullanacağız
// VEYA ImageUploader'ı src/components/ altına taşıyıp genel bir isim verebiliriz.
// Örneğin: src/components/shared/ImageUploader.tsx

interface ProfileImageUploaderProps {
  currentImagePublicId: string | null; // Bu prop'u bekliyoruz
  onFileSelect: (file: File | null) => void; // Seçilen dosyayı dışarı verir
  // userId prop'una artık burada ihtiyacımız yok, identifier olarak ImageUploader'a geçilecek
}

export default function ProfileImageUploader({
  currentImagePublicId,
  onFileSelect,
}: ProfileImageUploaderProps) {
  return (
    <ImageUploader
      currentImagePublicId={currentImagePublicId}
      onFileSelect={onFileSelect} // Dosya seçildiğinde üst bileşeni bilgilendir
      aspectRatio="aspect-square"
      label="Profil Fotoğrafı"
      maxFileSizeMB={2} // Profil resmi için boyut
      // uploadContext ve identifier gibi proplar, ImageUploader'ı çağıran yerde (örn: profil sayfası) set edilecek
      // uploadApiEndpoint, folder da ImageUploader'dan kaldırıldığı için burada da yok.
    />
  );
}