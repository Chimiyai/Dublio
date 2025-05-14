// src/components/admin/AddArtistForm.tsx
'use client';

import { useState, FormEvent, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';
import toast from 'react-hot-toast';

interface FormErrors {
  firstName?: string[];
  lastName?: string[];
  bio?: string[];
  imagePublicId?: string[];
  general?: string;
}

export default function AddArtistForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // AddArtistForm için başlangıçta public ID her zaman null olacak
  const [currentImagePublicIdForUploader, setCurrentImagePublicIdForUploader] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    
    let formValid = true;
    if (!firstName.trim()) { 
        setErrors(prev => ({ ...prev, firstName: ["Ad boş bırakılamaz."] })); 
        formValid = false;
    }
    if (!lastName.trim()) { 
        setErrors(prev => ({ ...prev, lastName: ["Soyad boş bırakılamaz."] })); 
        formValid = false;
    }
    if (!formValid) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }

    const loadingToastId = toast.loading('Sanatçı kaydediliyor...'); // Ana işlem için yükleme toast'ı
    
    startTransition(async () => {
      let finalImagePublicIdToSave: string | null = null;
      let uploadToastId: string | undefined; // Resim yükleme için ayrı toast ID

      try {
        if (selectedFile) {
          uploadToastId = toast.loading("Profil resmi Cloudinary'ye yükleniyor...", { id: 'add-artist-upload-toast' });
          const formData = new FormData();
          formData.append('imageFile', selectedFile);
          const tempIdentifier = firstName && lastName ? `${firstName}_${lastName}`.toLowerCase().replace(/\s+/g, '_') : 'yeni_sanatci';
          formData.append('identifier', tempIdentifier);
          formData.append('folder', 'artist_profiles');
          
          const uploadResponse = await fetch('/api/admin/sanatcilar/profile-image', {
            method: 'POST',
            body: formData,
          });
          const uploadData = await uploadResponse.json();
          toast.dismiss(uploadToastId); // Resim yükleme toast'ını kapat

          if (!uploadResponse.ok) {
            throw new Error(uploadData.message || 'Resim Cloudinary\'ye yüklenemedi.');
          }
          finalImagePublicIdToSave = uploadData.publicId;
          toast.success('Profil resmi başarıyla Cloudinary\'ye yüklendi.');
        }

        const response = await fetch('/api/admin/sanatcilar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            bio: bio.trim() === '' ? null : bio,
            imagePublicId: finalImagePublicIdToSave,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          if (data.errors) {
            setErrors(data.errors);
            throw new Error("Lütfen formdaki hataları düzeltin."); // Hata fırlat, catch yakalasın
          } else {
            throw new Error(data.message || 'Sanatçı oluşturulurken bir hata oluştu.'); // Hata fırlat
          }
        }

        toast.success(`'${data.firstName} ${data.lastName}' adlı sanatçı başarıyla eklendi!`);
        setSelectedFile(null); 
        setCurrentImagePublicIdForUploader(null); // Yeni sanatçı sonrası ImageUploader'ı sıfırla
        // Formu sıfırla (isteğe bağlı)
        setFirstName('');
        setLastName('');
        setBio('');
        
        // Yönlendirmeden önce ana yükleme toast'ını kapat
        toast.dismiss(loadingToastId);
        router.push('/admin/sanatcilar');
        router.refresh(); 

      } catch (err: any) { 
        // Hata durumunda da tüm aktif toast'ları kapat (eğer varsa)
        if (uploadToastId) toast.dismiss(uploadToastId);
        // loadingToastId zaten aşağıda finally'de kapatılacak
        toast.error(err.message || 'Bir hata oluştu.');
        setErrors(prev => ({ ...prev, general: err.message || 'Bir hata oluştu.'}));
      } finally {
        // Her durumda (başarı veya hata) ana yükleme toast'ını kapat
        toast.dismiss(loadingToastId);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 space-y-6">
      {errors.general && (
         <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {errors.general}
         </div>
      )}
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adı <span className="text-red-500">*</span></label>
        <input type="text" name="firstName" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"/>
        {errors.firstName && <p className="mt-2 text-xs text-red-600">{errors.firstName.join(', ')}</p>}
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Soyadı <span className="text-red-500">*</span></label>
        <input type="text" name="lastName" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"/>
        {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName.join(', ')}</p>}
      </div>
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Biyografi</label>
        <textarea name="bio" id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"/>
        {errors.bio && <p className="mt-2 text-sm text-red-600">{errors.bio.join(', ')}</p>}
      </div>
      <ImageUploader
        currentImagePublicId={currentImagePublicIdForUploader} // Formun o anki resim durumunu gösterir
        onFileSelect={(file) => {
          setSelectedFile(file);
          // Yeni dosya seçildiğinde, ImageUploader'a geçilen publicId'yi null yap ki
          // CldImage yerine data URL önizlemesi (varsa) tetiklensin.
          // Bu, ImageUploader içindeki mantıkla da uyumlu olmalı.
          if (file) {
            setCurrentImagePublicIdForUploader(null); 
          } else {
            // Dosya seçimi iptal edilirse, ImageUploader'a başlangıçtaki null değerini geri ver
            setCurrentImagePublicIdForUploader(null); 
          }
        }}
        aspectRatio="aspect-square"
        label="Profil Resmi"
        maxFileSizeMB={5}
        // uploadApiEndpoint, folder, identifier propları ImageUploader'dan kaldırıldı.
      />
      {errors.imagePublicId && <p className="mt-2 text-sm text-red-600">{errors.imagePublicId.join(', ')}</p>}
      
      <div className="pt-5">
        <div className="flex justify-end space-x-3">
          <Link href="/admin/sanatcilar" className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm transition duration-150 ease-in-out">
            İptal
          </Link>
          <button type="submit" disabled={isPending} className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isPending ? 'Kaydediliyor...' : 'Sanatçıyı Kaydet'}
          </button>
        </div>
      </div>
    </form>
  );
}