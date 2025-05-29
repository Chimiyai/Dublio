// src/components/admin/ProjectImagesManager.tsx
'use client';
import ImageUploader from './ImageUploader'; // Bu component'in zaten var olduğunu varsayıyorum

interface ProjectImagesManagerProps {
  coverImagePublicId: string | null;
  onCoverImagePublicIdChange: (id: string | null) => void;
  onCoverFileSelect: (file: File | null) => void; // Ana formdaki selectedCoverFile'ı set etmek için
  
  bannerImagePublicId: string | null;
  onBannerImagePublicIdChange: (id: string | null) => void;
  onBannerFileSelect: (file: File | null) => void; // Ana formdaki selectedBannerFile'ı set etmek için
  
  initialCoverId?: string | null; // Düzenleme modunda ilk değer için
  initialBannerId?: string | null; // Düzenleme modunda ilk değer için
  errors: { coverImagePublicId?: string[], bannerImagePublicId?: string[] };
}

export default function ProjectImagesManager({
  coverImagePublicId, onCoverImagePublicIdChange, onCoverFileSelect,
  bannerImagePublicId, onBannerImagePublicIdChange, onBannerFileSelect,
  initialCoverId, initialBannerId, errors
}: ProjectImagesManagerProps) {
  return (
    <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
      <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">Görseller</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
        Projenin kapak ve banner resimleri.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Kapak Resmi</label>
          <ImageUploader
            currentImagePublicId={coverImagePublicId}
            onFileSelect={(file) => {
              onCoverFileSelect(file); // Ana forma seçilen dosyayı bildir
              if (file) onCoverImagePublicIdChange(URL.createObjectURL(file)); // Önizleme için URL
              else onCoverImagePublicIdChange(initialCoverId || null); // Dosya kaldırılırsa ilk ID'ye dön
            }}
            aspectRatio="aspect-[16/9]"
            label="Kapak Resmi Yükle / Değiştir"
            maxFileSizeMB={5}
          />
          {errors.coverImagePublicId && <p className="mt-1 text-xs text-red-500">{errors.coverImagePublicId.join(', ')}</p>}
        </div>

        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Banner Resmi</label>
          <ImageUploader
            currentImagePublicId={bannerImagePublicId}
            onFileSelect={(file) => {
              onBannerFileSelect(file);
              if (file) onBannerImagePublicIdChange(URL.createObjectURL(file));
              else onBannerImagePublicIdChange(initialBannerId || null);
            }}
            aspectRatio="aspect-[21/9]"
            label="Banner Resmi Yükle / Değiştir"
            maxFileSizeMB={8}
          />
          {errors.bannerImagePublicId && <p className="mt-1 text-xs text-red-500">{errors.bannerImagePublicId.join(', ')}</p>}
        </div>
      </div>
    </div>
  );
}