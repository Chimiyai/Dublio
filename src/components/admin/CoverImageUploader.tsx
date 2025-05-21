// src/components/admin/CoverImageUploader.tsx
'use client';

import { useState, useTransition, ChangeEvent, useRef, useEffect } from 'react';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';

interface CoverImageUploaderProps {
  currentCoverImageUrl: string | null;
  currentCoverImagePublicId: string | null;
  onUploadComplete: (data: { imageUrl: string; publicId: string }) => void;
  projectIdOrSlug?: string; // Yükleme sırasında public_id oluşturmak için
}

export default function CoverImageUploader({
  currentCoverImageUrl,
  currentCoverImagePublicId,
  onUploadComplete,
  projectIdOrSlug
}: CoverImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCoverImageUrl);
  const [uploadedImagePublicId, setUploadedImagePublicId] = useState<string | null>(null); // YENİ: Yüklenen resmin public ID'sini tutmak için
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prop'tan gelen resim URL'si veya Public ID değiştiğinde önizlemeyi güncelle
  useEffect(() => {
    if (!file && !uploadedImagePublicId) {
      if (currentCoverImageUrl) {
        setPreviewUrl(currentCoverImageUrl);
      } else if (currentCoverImagePublicId) {
        // CldImage için public ID'yi doğrudan kullanacağız, previewUrl'i null yapabiliriz
        // ya da burada da CldImage'in URL oluşturma mantığını taklit edebiliriz.
        // Şimdilik CldImage'in göstermesine bırakalım.
        setPreviewUrl(null); 
      } else {
        setPreviewUrl(null);
      }
    }
  }, [currentCoverImageUrl, currentCoverImagePublicId, file, uploadedImagePublicId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setSuccessMessage(null);
    setError(null);
    setUploadedImagePublicId(null);

    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Lütfen bir resim dosyası seçin (JPG, PNG, WEBP vb.).');
        setFile(null);
        setPreviewUrl(currentCoverImageUrl); // Mevcut resme (veya public ID'ye göre gösterilene) dön
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const maxSizeInBytes = 8 * 1024 * 1024; // 8MB (API ile aynı)
      if (selectedFile.size > maxSizeInBytes) {
        setError(`Dosya boyutu çok büyük. Maksimum ${maxSizeInBytes / (1024 * 1024)}MB olabilir.`);
        setFile(null);
        setPreviewUrl(currentCoverImageUrl);
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
      if (currentCoverImageUrl) setPreviewUrl(currentCoverImageUrl);
      else if (currentCoverImagePublicId) setPreviewUrl(null); // CldImage'in public ID'den göstermesi için
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
    formData.append('coverImageFile', file);
    if (projectIdOrSlug) {
        formData.append('projectIdOrSlug', projectIdOrSlug);
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/projects/cover-image', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Kapak resmi yüklenirken bir hata oluştu.');
          return;
        }

        setSuccessMessage('Resim başarıyla Cloudinary\'ye yüklendi! Değişiklikleri kaydetmeyi unutmayın.');
        onUploadComplete({ imageUrl: data.imageUrl, publicId: data.publicId });
        // YÜKLEME SONRASI ÖNİZLEME GÜNCELLEMESİ
        setPreviewUrl(data.imageUrl); // Cloudinary'den gelen TAM URL ile önizlemeyi güncelle
        setUploadedImagePublicId(data.publicId); // Yüklenen resmin public ID'sini sakla
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setSuccessMessage(null), 4000);

      } catch (err) {
        // ... (hata yönetimi aynı)
        console.error('Kapak resmi yükleme fetch hatası:', err);
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

  if (previewUrl && previewUrl.startsWith('data:')) { // Kullanıcı yeni dosya seçti (henüz yüklenmedi)
    displayImageUrl = previewUrl;
  } else if (uploadedImagePublicId) { // Yeni resim yüklendi
    displayImageUrl = previewUrl; // Bu, yükleme sonrası Cloudinary'den gelen tam URL olmalı
    // displayPublicId = uploadedImagePublicId; // Eğer CldImage kullanacaksak bunu kullanabiliriz
  } else if (currentCoverImagePublicId) { // Mevcut public ID var
    displayPublicId = currentCoverImagePublicId;
  } else if (currentCoverImageUrl) { // Mevcut tam URL var
    displayImageUrl = currentCoverImageUrl;
  }

  return (
    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Kapak Resmi
      </label>
      
      <div className="mb-3 bg-gray-100 dark:bg-gray-700/50 rounded overflow-hidden aspect-[16/9] w-full max-w-sm mx-auto flex items-center justify-center">
        {displayImageUrl ? (
            <img src={displayImageUrl} alt="Kapak Resmi Önizleme" className="object-contain w-full h-full" />
        ) : displayPublicId ? (
             <CldImage
                src={displayPublicId} // Public ID'yi kullan
                alt="Mevcut Kapak Resmi"
                width={320} 
                height={180}
                crop="fill"
                gravity="center"
                className="object-cover w-full h-full" // CldImage object-cover/contain'i kendi props'larıyla yönetir
            />
        ) : (
          <PhotoIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
        )}
      </div>

      {/* Yükleme Kontrolleri (Aynı kalabilir) */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <PhotoIcon className="h-5 w-5 mr-2" />
          {/* Buton metnini de dinamik yapalım */}
          {displayImageUrl || displayPublicId ? "Değiştir" : "Resim Seç"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {file && ( // Sadece yeni bir dosya seçilmişse Yükle butonunu göster
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <ArrowUpTrayIcon className={`h-5 w-5 mr-2 ${isUploading ? 'animate-pulse' : ''}`} />
            {isUploading ? 'Yükleniyor...' : 'Yükle'}
          </button>
        )}
      </div>
      
      {file && ( // Seçilen dosya adını göster
           <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
             Seçilen dosya: {file.name}
           </p>
         )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
    </div>
  );
}