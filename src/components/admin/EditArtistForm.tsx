// src/components/admin/EditArtistForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, FormEvent, useEffect } from 'react';
import { DubbingArtist } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import toast from 'react-hot-toast';

interface EditArtistFormProps {
  artist: DubbingArtist; 
}

interface FormErrors {
  firstName?: string[];
  lastName?: string[];
  bio?: string[];
  imagePublicId?: string[];
  general?: string;
}

const getArchivePublicId = (oldPublicId: string, typePrefix: string) => {
    if (!oldPublicId) return null;
    const baseArchiveFolder = 'kullanilmayanlar';
    const subFolder = typePrefix;
    let filenamePart = oldPublicId;
    let originalFolderPath = '';
    if (oldPublicId.includes('/')) {
        const parts = oldPublicId.split('/');
        filenamePart = parts.pop() || oldPublicId; 
        if (parts.length > 0) {
            originalFolderPath = parts.join('/') + '/'; 
        }
    }
    return `${baseArchiveFolder}/${originalFolderPath}${subFolder}_${filenamePart}_${Date.now()}`.substring(0, 200);
};

export default function EditArtistForm({ artist }: EditArtistFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(artist.firstName);
  const [lastName, setLastName] = useState(artist.lastName);
  const [bio, setBio] = useState(artist.bio || '');
  
  const [formImagePublicId, setFormImagePublicId] = useState<string | null>(artist.imagePublicId || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFirstName(artist.firstName);
    setLastName(artist.lastName);
    setBio(artist.bio || '');
    // Eğer kullanıcı yeni bir dosya seçmemişse, formun public ID'sini prop'tan gelenle senkronize et.
    if (!selectedFile) {
      setFormImagePublicId(artist.imagePublicId || null);
    }
  }, [artist, selectedFile]); // selectedFile'ı da dinle

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

    const loadingToastId = toast.loading('Değişiklikler kaydediliyor...');
    startTransition(async () => {
      let finalImagePublicIdToSave = formImagePublicId; 
      let newPublicIdFromUpload: string | null = null;
      const originalDbPublicId = artist.imagePublicId || null;
      let oldPublicIdToArchive: string | null = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('imageFile', selectedFile);
        formData.append('identifier', artist.id.toString());
        formData.append('folder', 'artist_profiles');
        
        try {
          toast.loading("Profil resmi Cloudinary'ye yükleniyor...", { id: 'edit-artist-upload-toast' });
          const uploadResponse = await fetch('/api/admin/sanatcilar/profile-image', {
            method: 'POST',
            body: formData,
          });
          const uploadData = await uploadResponse.json();
          toast.dismiss('edit-artist-upload-toast');

          if (!uploadResponse.ok) {
            throw new Error(uploadData.message || 'Resim Cloudinary\'ye yüklenemedi.');
          }
          newPublicIdFromUpload = uploadData.publicId;
          finalImagePublicIdToSave = newPublicIdFromUpload; 
          toast.success('Profil resmi başarıyla Cloudinary\'ye yüklendi.');
          
          if (originalDbPublicId && originalDbPublicId !== newPublicIdFromUpload) {
            oldPublicIdToArchive = originalDbPublicId;
          }
          // Formun ana state'ini yeni yüklenen ID ile güncelle (bu, ImageUploader'a da yansır)
          setFormImagePublicId(newPublicIdFromUpload);

        } catch (uploadError: any) {
          toast.dismiss(loadingToastId);
          toast.error(uploadError.message || 'Resim yüklenirken bir hata oluştu.');
          setErrors(prev => ({ ...prev, imagePublicId: [uploadError.message] }));
          return; 
        }
      }

      const dataToUpdate: {
          firstName?: string;
          lastName?: string;
          bio?: string | null;
          imagePublicId?: string | null;
      } = {};
      let hasChanges = false;

      if (firstName !== artist.firstName) { dataToUpdate.firstName = firstName; hasChanges = true; }
      if (lastName !== artist.lastName) { dataToUpdate.lastName = lastName; hasChanges = true; }
      const originalBio = artist.bio || '';
      const currentBioTrimmed = bio.trim();
      if (currentBioTrimmed !== originalBio) { dataToUpdate.bio = currentBioTrimmed === '' ? null : currentBioTrimmed; hasChanges = true; }
      
      if (finalImagePublicIdToSave !== originalDbPublicId) {
          dataToUpdate.imagePublicId = finalImagePublicIdToSave; 
          hasChanges = true;
      }
      
      if (!hasChanges) { 
          toast.dismiss(loadingToastId);
          toast("Değişiklik yapılmadı.");
          setSelectedFile(null); 
          return;
      }
      
      if (oldPublicIdToArchive) {
        const archiveTargetId = getArchivePublicId(oldPublicIdToArchive, 'sanatcilar'); // typePrefix doğru
        if (archiveTargetId) {
            try {
                console.log(`ESKİ SANATÇI RESMİ ARŞİVLENECEK: ${oldPublicIdToArchive} -> ${archiveTargetId}`);
                // Arşivleme API çağrısı (henüz implemente edilmedi, sadece log)
                // await fetch('/api/admin/cloudinary-utils/archive-image', { /* ... */ });
            } catch (e) { console.error("Arşivleme API çağrı hatası:", e); }
        }
      }

      try {
        const response = await fetch(`/api/admin/sanatcilar/${artist.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToUpdate) });
        const data = await response.json();

        if (!response.ok) {
          toast.dismiss(loadingToastId); 
          if (data.errors) {
            setErrors(data.errors);
            toast.error("Lütfen formdaki hataları düzeltin.");
          } else {
            const errorMessage = data.message || 'Sanatçı güncellenirken bir hata oluştu.';
            toast.error(errorMessage);
            setErrors({ general: errorMessage });
          }
          return;
        }
        toast.dismiss(loadingToastId);
        toast.success(`'${data.firstName} ${data.lastName}' adlı sanatçı başarıyla güncellendi.`);
        setSelectedFile(null); 
        // Formun public ID state'ini API'den dönen son değerle eşitlemek iyi bir pratik olabilir,
        // ama router.refresh() zaten prop'u güncelleyeceği için useEffect bunu halleder.
        // setFormImagePublicId(data.imagePublicId || null); 
        router.refresh(); 
      } catch (err: any) { 
        toast.dismiss(loadingToastId); 
        const errorMessage = err.message || 'Bir ağ hatası oluştu.';
        toast.error(errorMessage);
        setErrors({ general: errorMessage });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
      {errors.general && (
         <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300" role="alert">
            {errors.general}
         </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adı <span className="text-red-500">*</span></label>
          <input type="text" name="firstName" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"/>
          {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName.join(', ')}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Soyadı <span className="text-red-500">*</span></label>
          <input type="text" name="lastName" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"/>
          {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName.join(', ')}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Biyografi</label>
        <textarea name="bio" id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"/>
        {errors.bio && <p className="mt-2 text-sm text-red-600">{errors.bio.join(', ')}</p>}
      </div>
      <ImageUploader
        currentImagePublicId={formImagePublicId} // Düzeltildi: Formun kendi state'ini prop olarak ver
        onFileSelect={(file) => {
          setSelectedFile(file);
          // Kullanıcı yeni bir dosya seçtiğinde, ImageUploader'ın önizlemesi data URL'e geçer.
          // formImagePublicId'yi burada değiştirmeye gerek yok, çünkü handleSubmit içinde
          // selectedFile varsa zaten yeni bir publicId ile güncellenecek.
          // Eğer file null ise (seçim iptal), ImageUploader'ın önizlemesi zaten
          // prop olarak aldığı formImagePublicId'ye (yani artist.imagePublicId) döner.
        }}
        // Bu proplar artık ImageUploaderProps'ta yok:
        // uploadApiEndpoint="/api/admin/sanatcilar/profile-image" 
        // folder="artist_profiles"
        // identifier={artist.id.toString()}
        aspectRatio="aspect-square"
        label="Profil Resmi"
        maxFileSizeMB={5} // Bu prop ImageUploader'da tanımlı olmalı
      />
      {errors.imagePublicId && <p className="mt-2 text-sm text-red-600">{errors.imagePublicId.join(', ')}</p>}
      
      <div>
        <button type="submit" disabled={isPending} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          {isPending ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </form>
  );
}