'use client';

import { useState, useTransition, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary'; // Cloudinary resimlerini göstermek için

interface BannerImageUploaderProps {
  currentImageUrl: string | null; // Mevcut banner resmi URL'si
}

export default function BannerImageUploader({ currentImageUrl }: BannerImageUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  // Önizleme state'i banner için de kullanılabilir, başlangıç değeri prop'tan gelir
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl); 
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null); 

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
       if (!selectedFile.type.startsWith('image/')) {
          setError('Lütfen bir resim dosyası seçin (örn: JPG, PNG, WEBP).');
          setFile(null);
          setPreviewUrl(currentImageUrl); 
          if (fileInputRef.current) fileInputRef.current.value = ''; 
          return;
       }
       // Banner için boyut kontrolü (API ile aynı olmalı)
       const maxSizeInBytes = 10 * 1024 * 1024; // 10 MB
       if (selectedFile.size > maxSizeInBytes) {
         setError(`Dosya boyutu çok büyük. Maksimum ${maxSizeInBytes / (1024 * 1024)}MB olabilir.`);
         setFile(null);
         setPreviewUrl(currentImageUrl);
         if (fileInputRef.current) fileInputRef.current.value = '';
         return;
       }

      setFile(selectedFile);
      setError(null); 
      setSuccessMessage(null); 

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreviewUrl(currentImageUrl); 
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
    // --- DEĞİŞİKLİK: Form alanının adı ---
    formData.append('bannerImage', file); // API'nin beklediği isim
    // -----------------------------------


    startTransition(async () => {
      try {
        // --- DEĞİŞİKLİK: API Endpoint Yolu ---
        const response = await fetch('/api/profile/banner', { 
        // -----------------------------------
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Yükleme sırasında bir hata oluştu.');
          return;
        }

        setSuccessMessage(data.message || 'Banner başarıyla yüklendi!');
        setFile(null); 
        if (fileInputRef.current) fileInputRef.current.value = ''; 
        router.refresh(); // Sayfayı yenile
        setTimeout(() => setSuccessMessage(null), 4000);

      } catch (err) {
        console.error('Banner yükleme fetch hatası:', err);
        setError('Yükleme sırasında bir ağ hatası oluştu.');
      }
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Profil Banner Resmi</h2>
      
      {/* Banner Önizleme/Mevcut Banner */}
      <div className="mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-w-16 aspect-h-5 min-h-[150px] flex items-center justify-center"> 
        {previewUrl ? (
          <img // CldImage yerine img kullanıyoruz
          src={previewUrl}
          alt="Profil Banner Önizleme"
          className="object-cover w-full h-full"
          loading="lazy"
        />
        ) : (
          <div className="flex items-center justify-center h-full"> {/* Varsayılan ikon için container */}
             <PhotoIcon className="h-16 w-16 text-gray-400 ..." />
          </div>
        )}
      </div>

      {/* Yükleme Kontrolleri */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
         <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <PhotoIcon className="h-5 w-5 mr-2" />
            {file ? "Başka Banner Seç" : "Banner Seç"}
          </button>

         <input
            ref={fileInputRef}
            type="file"
            accept="image/*" 
            onChange={handleFileChange}
            className="hidden"
          />
          
         {file && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <ArrowUpTrayIcon className={`h-5 w-5 mr-2 ${isUploading ? 'animate-pulse' : ''}`} />
              {isUploading ? 'Yükleniyor...' : 'Banner Yükle'}
            </button>
          )}
          
          {/* Seçilen Dosya Adı */}
         {file && (
             <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1 text-right">
               Seçilen: {file.name}
             </p>
           )}
      </div>

       {/* Hata ve Başarı Mesajları */}
       {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
       {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}

    </div>
  );
}