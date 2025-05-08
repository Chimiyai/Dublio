'use client';

import { useState, useTransition, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary'; // Cloudinary resimlerini göstermek için

interface ProfileImageUploaderProps {
  currentImageUrl: string | null; // Mevcut profil resmi URL'si
}

export default function ProfileImageUploader({ currentImageUrl }: ProfileImageUploaderProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl); // Başlangıçta mevcut resmi göster
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null); // Dosya inputuna erişim için

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Dosya tipi kontrolü (isteğe bağlı frontend kontrolü)
       if (!selectedFile.type.startsWith('image/')) {
          setError('Lütfen bir resim dosyası seçin (örn: JPG, PNG, WEBP).');
          setFile(null);
          setPreviewUrl(currentImageUrl); // Önizlemeyi eski haline getir
          if (fileInputRef.current) fileInputRef.current.value = ''; // Input'u temizle
          return;
       }
        // Dosya boyutu kontrolü (isteğe bağlı frontend kontrolü)
       const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB (API ile aynı olmalı)
       if (selectedFile.size > maxSizeInBytes) {
         setError(`Dosya boyutu çok büyük. Maksimum ${maxSizeInBytes / (1024 * 1024)}MB olabilir.`);
         setFile(null);
         setPreviewUrl(currentImageUrl);
         if (fileInputRef.current) fileInputRef.current.value = '';
         return;
       }

      setFile(selectedFile);
      setError(null); // Hataları temizle
      setSuccessMessage(null); // Başarı mesajını temizle

      // Dosya önizlemesi oluştur
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // Dosya seçimi iptal edildi veya dosya yok
      setFile(null);
      setPreviewUrl(currentImageUrl); // Mevcut resme geri dön
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
    formData.append('profileImage', file); // API'nin beklediği isim ('profileImage')

    startTransition(async () => {
      try {
        const response = await fetch('/api/profile/image', {
          method: 'POST',
          body: formData,
          // FormData gönderirken Content-Type header'ını belirtme! Tarayıcı otomatik yapar.
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Yükleme sırasında bir hata oluştu.');
          // Başarısız olursa önizlemeyi eski haline döndür? (Opsiyonel)
          // setPreviewUrl(currentImageUrl);
          // setFile(null);
          // if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setSuccessMessage(data.message || 'Profil fotoğrafı başarıyla yüklendi!');
        setFile(null); // Yükleme sonrası dosyayı temizle
        if (fileInputRef.current) fileInputRef.current.value = ''; // Input'u temizle
        // Yeni URL state'e yansıdı, router.refresh ile sayfanın da yeni prop almasını sağla
        router.refresh(); 
         // Başarı mesajını birkaç saniye sonra temizle
        setTimeout(() => setSuccessMessage(null), 4000);


      } catch (err) {
        console.error('Profil fotoğrafı yükleme fetch hatası:', err);
        setError('Yükleme sırasında bir ağ hatası oluştu.');
      }
    });
  };

  // Dosya seçme penceresini açmak için
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Profil Fotoğrafı</h2>
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
        {/* Resim Önizleme/Mevcut Resim */}
        <div className="flex-shrink-0">
          {previewUrl ? (
            <img // CldImage yerine img kullanıyoruz (önceki adıma göre)
            src={previewUrl} // Doğrudan URL veya data: URL
            width={128} 
            height={128} 
            alt="Profil Fotoğrafı Önizleme"
            className="rounded-full object-cover border-4 ..."
          />
          ) : (
            <UserCircleIcon className="h-32 w-32 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        {/* Yükleme Kontrolleri */}
        <div className="flex-grow w-full sm:w-auto">
          {/* Dosya Seçme Butonu (gizli input'u tetikler) */}
           <button
              type="button"
              onClick={triggerFileInput}
              disabled={isUploading}
              className="w-full sm:w-auto mb-3 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <PhotoIcon className="h-5 w-5 mr-2" />
              {file ? "Başka Bir Resim Seç" : "Resim Seç"}
            </button>
            
           {/* Gizli Dosya Input'u */}
           <input
              ref={fileInputRef}
              type="file"
              accept="image/*" // Sadece resim dosyalarını kabul et
              onChange={handleFileChange}
              className="hidden" // Görünmez yap
            />

           {/* Seçilen Dosya Adı (Opsiyonel) */}
           {file && (
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 truncate">
               Seçilen: {file.name}
             </p>
           )}

          {/* Yükle Butonu */}
          {file && ( // Sadece dosya seçiliyse göster
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

           {/* Hata ve Başarı Mesajları */}
           {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
           {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}

        </div>
      </div>
    </div>
  );
}