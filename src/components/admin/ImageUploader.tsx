// src/components/admin/CoverImageUploader.tsx
'use client';

import { useState, useTransition, ChangeEvent, useRef, useEffect } from 'react';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';

interface ImageUploaderProps {
  currentImageUrl: string | null;
  currentImagePublicId: string | null;
  onUploadComplete: (data: { imageUrl: string; publicId: string }) => void;
  uploadApiEndpoint: string; // YENİ: Hangi API'ye yüklenecek
  folder?: string; // YENİ: Cloudinary klasörü (opsiyonel)
  identifier?: string; // YENİ: Dosya adını özelleştirmek için (opsiyonel)
  aspectRatio?: string; // YENİ: Önizleme için en-boy oranı (örn: "aspect-[16/9]", "aspect-square")
  maxFileSizeMB?: number; // YENİ: MB cinsinden maksimum dosya boyutu
  label?: string; // YENİ: Bileşen etiketi
}

export default function ImageUploader({
  currentImageUrl,
  currentImagePublicId,
  onUploadComplete,
  uploadApiEndpoint, // Yeni prop
  folder,            // Yeni prop
  identifier,        // Yeni prop
  aspectRatio = 'aspect-[16/9]', // Varsayılan en-boy oranı
  maxFileSizeMB = 8,             // Varsayılan maksimum boyut
  label = 'Resim Yükleyici'      // Varsayılan etiket
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [uploadedImagePublicId, setUploadedImagePublicId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file && !uploadedImagePublicId) {
      if (currentImageUrl) {
        setPreviewUrl(currentImageUrl);
      } else if (currentImagePublicId) {
        setPreviewUrl(null); // CldImage'in public ID'den göstermesi için
      } else {
        setPreviewUrl(null);
      }
    }
  }, [currentImageUrl, currentImagePublicId, file, uploadedImagePublicId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setSuccessMessage(null);
    setError(null);
    setUploadedImagePublicId(null);

    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Lütfen bir resim dosyası seçin.');
        setFile(null);
        setPreviewUrl(currentImageUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const maxSizeInBytes = maxFileSizeMB * 1024 * 1024;
      if (selectedFile.size > maxSizeInBytes) {
        setError(`Dosya boyutu çok büyük. Maksimum ${maxFileSizeMB}MB olabilir.`);
        setFile(null);
        setPreviewUrl(currentImageUrl);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      if (currentImageUrl) setPreviewUrl(currentImageUrl);
      else if (currentImagePublicId) setPreviewUrl(null);
      else setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Lütfen önce bir dosya seçin.');
      return;
    }
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('imageFile', file); // Alan adını daha genel yapalım: 'imageFile'
    if (identifier) {
      formData.append('identifier', identifier); // Eski 'projectIdOrSlug' yerine 'identifier'
    }
    if (folder) {
      formData.append('folder', folder); // Klasör bilgisi
    }

    startTransition(async () => {
      try {
        const response = await fetch(uploadApiEndpoint, { // Dinamik API rotası
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || `${label} yüklenirken bir hata oluştu.`);
          return;
        }

        setSuccessMessage('Resim başarıyla Cloudinary\'ye yüklendi! Değişiklikleri kaydetmeyi unutmayın.');
        onUploadComplete({ imageUrl: data.imageUrl, publicId: data.publicId });
        setPreviewUrl(data.imageUrl);
        setUploadedImagePublicId(data.publicId);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err) {
        console.error(`${label} yükleme fetch hatası:`, err);
        setError('Yükleme sırasında bir ağ hatası oluştu.');
      }
    });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
      fileInputRef.current.click();
    }
  };
  // HANGİ RESMİN GÖSTERİLECEĞİNE KARAR VEREN MANTIK
  let displayImageUrl: string | null = null;
  let displayPublicId: string | null = null;

  if (previewUrl && previewUrl.startsWith('data:')) {
    displayImageUrl = previewUrl;
  } else if (uploadedImagePublicId) {
    displayImageUrl = previewUrl; // Bu, yükleme sonrası Cloudinary'den gelen tam URL olmalı
  } else if (currentImagePublicId) {
    displayPublicId = currentImagePublicId;
  } else if (currentImageUrl) {
    displayImageUrl = currentImageUrl;
  }

  return (
    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      
      <div className={`mb-3 bg-gray-100 dark:bg-gray-700/50 rounded overflow-hidden ${aspectRatio} w-full max-w-sm mx-auto flex items-center justify-center`}>
        {displayImageUrl ? (
            <img src={displayImageUrl} alt={`${label} Önizleme`} className="object-contain w-full h-full" />
        ) : displayPublicId ? (
             <CldImage
                src={displayPublicId}
                alt={`Mevcut ${label}`}
                width={320} // Bu değerler aspectRatio'ya göre ayarlanmalı veya CldImage'a bırakılmalı
                height={aspectRatio === 'aspect-square' ? 320 : 180} // Örnek
                crop="fill"
                gravity="auto" // veya 'face'
                className="object-cover w-full h-full" 
            />
        ) : (
          <PhotoIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button type="button" onClick={triggerFileInput} disabled={isUploading} /* ... (classlar aynı) ... */ >
          <PhotoIcon className="h-5 w-5 mr-2" />
          {displayImageUrl || displayPublicId ? "Değiştir" : "Resim Seç"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        {file && (
          <button type="button" onClick={handleUpload} disabled={isUploading || !file} /* ... (classlar aynı) ... */ >
            <ArrowUpTrayIcon className={`h-5 w-5 mr-2 ${isUploading ? 'animate-pulse' : ''}`} />
            {isUploading ? 'Yükleniyor...' : 'Yükle'}
          </button>
        )}
      </div>
      
      {file && ( <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">Seçilen dosya: {file.name}</p> )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
    </div>
  );
}
