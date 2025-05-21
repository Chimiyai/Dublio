// src/components/admin/ImageUploader.tsx
'use client';

import { useState, ChangeEvent, useRef, useEffect } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline'; // Sadece PhotoIcon lazım
import { CldImage } from 'next-cloudinary';

interface ImageUploaderProps {
  currentImagePublicId: string | null;
  onFileSelect: (file: File | null) => void; // Sadece bu callback
  aspectRatio?: string;
  maxFileSizeMB?: number;
  label?: string;
}

export default function ImageUploader({
  currentImagePublicId,
  onFileSelect,
  aspectRatio = 'aspect-[16/9]',
  maxFileSizeMB = 8,
  label = 'Resim',
}: ImageUploaderProps) {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Eğer prop'tan gelen public ID değişirse ve aktif bir data URL önizlemesi yoksa,
    // data URL'i temizle ki CldImage güncel prop'u kullansın.
    if (!previewDataUrl) {
        // Bir şey yapmaya gerek yok, CldImage zaten currentImagePublicId prop'unu kullanacak.
    }
  }, [currentImagePublicId, previewDataUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setError(null);
    setPreviewDataUrl(null);

    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Lütfen bir resim dosyası seçin.');
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const actualMaxFileSizeMB = maxFileSizeMB;
      if (selectedFile.size > actualMaxFileSizeMB * 1024 * 1024) {
        setError(`Dosya boyutu çok büyük. Maksimum ${actualMaxFileSizeMB}MB olabilir.`);
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      onFileSelect(selectedFile); // Seçilen dosyayı üst bileşene bildir
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewDataUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else { 
      onFileSelect(null); // Seçim iptal edilirse veya dosya yoksa null bildir
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Her tıklamada inputu sıfırla ki aynı dosya tekrar seçilebilsin
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div 
        className={`mb-3 bg-gray-100 dark:bg-gray-700/50 rounded overflow-hidden ${aspectRatio} w-full max-w-sm mx-auto flex items-center justify-center cursor-pointer`}
        onClick={triggerFileInput} // Tıklanınca dosya seçimi açılsın
        title={previewDataUrl || currentImagePublicId ? "Resmi değiştirmek için tıklayın" : "Resim seçmek için tıklayın"}
      >
        {previewDataUrl ? ( 
            <img src={previewDataUrl} alt={`${label} Önizleme`} className="object-contain w-full h-full" />
        ) : currentImagePublicId ? ( 
             <CldImage
                src={currentImagePublicId}
                alt={`Mevcut ${label}`}
                width={320} // Bu boyutlar sadece CldImage'in layout'u için, gerçek boyut transformasyonlarla belirlenir
                height={aspectRatio === 'aspect-square' ? 320 : 180}
                crop="fill" gravity="auto" format="auto" quality="auto"
                className="object-cover w-full h-full"
            />
        ) : ( 
          <div className="text-center p-4">
            <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Resim seçmek için tıklayın veya sürükleyin</p>
          </div>
        )}
      </div>
      {/* "Resim Seç/Değiştir" butonu artık div'in kendisine tıklandığında tetikleniyor */}
      {/* Eski "Değiştir" butonu kaldırıldı */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      
      {previewDataUrl && fileInputRef.current?.files?.[0] && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
            Seçilen dosya: {fileInputRef.current.files[0].name}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
