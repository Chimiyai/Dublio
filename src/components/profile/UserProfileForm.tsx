// src/components/profile/UserProfileForm.tsx
'use client';

import { useState, FormEvent, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// User tipini Prisma'dan import etmeye gerek yok, UserProfileFormProps içinde tanımlı
// import { User } from '@prisma/client'; 
import ProfileImageUploader from '@/components/profile/ProfileImageUploader';
import BannerImageUploader from '@/components/profile/BannerImageUploader';
import UpdateUsernameForm from '@/components/profile/UpdateUsernameForm';
import UpdateBioForm from '@/components/profile/UpdateBioForm';
import UpdatePasswordForm from '@/components/profile/UpdatePasswordForm';
import UpdateEmailForm from '@/components/profile/UpdateEmailForm';
import toast from 'react-hot-toast';
import { CldImage } from 'next-cloudinary';
import { UserCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';


export interface UserProfileFormProps { 
  user: { 
    id: number; 
    username: string;
    bio: string | null;
    email: string;
    role: string;
    profileImagePublicId: string | null;
    bannerImagePublicId: string | null;
    createdAt: Date; 
    updatedAt: Date; 
  };
}

export default function UserProfileForm({ user: initialUser }: UserProfileFormProps) {
  const router = useRouter();
  // isPending, startTransition'dan gelen boolean değer
  const [isPending, startTransition] = useTransition(); 
  const [profileImageIdToDisplay, setProfileImageIdToDisplay] = useState<string | null>(initialUser.profileImagePublicId);
  const [bannerImageIdToDisplay, setBannerImageIdToDisplay] = useState<string | null>(initialUser.bannerImagePublicId);

  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);

  const [profilePublicId, setProfilePublicId] = useState<string | null>(initialUser.profileImagePublicId);
  const [bannerPublicId, setBannerPublicId] = useState<string | null>(initialUser.bannerImagePublicId);

  useEffect(() => {
    setProfileImageIdToDisplay(initialUser.profileImagePublicId);
    setBannerImageIdToDisplay(initialUser.bannerImagePublicId);
  }, [initialUser.profileImagePublicId, initialUser.bannerImagePublicId]);


  const handleImageSave = async (imageType: 'profile' | 'banner') => {
  const fileToUpload = imageType === 'profile' ? selectedProfileFile : selectedBannerFile;
  const currentPublicIdInDb = imageType === 'profile' ? initialUser.profileImagePublicId : initialUser.bannerImagePublicId;

  if (!fileToUpload) {
    toast.error("Lütfen önce bir dosya seçin.");
    return;
  }

  const loadingToastId = toast.loading(`${imageType === 'profile' ? 'Profil resmi' : 'Banner'} yükleniyor...`);
  
  startTransition(async () => {
      let newPublicId: string | null = null;
      try {
          const formData = new FormData();
          formData.append('imageFile', fileToUpload);
          formData.append('uploadContext', imageType === 'profile' ? 'userProfile' : 'userBanner'); // Bu API'ye gönderiliyor
          formData.append('identifier', initialUser.id.toString()); 
          // 'folder' API içinde uploadContext'e göre belirleniyor, buradan göndermeye gerek yok

          // YOLU KONTROL ET: Eğer API'niz /api/image-upload ise bunu kullanın
          const uploadResponse = await fetch('/api/image-upload', { // DÜZELTİLMİŞ OLMALI
              method: 'POST',
              body: formData,
          });
          // const uploadData = await uploadResponse.json(); // Hata kontrolünden sonra parse et

          if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({ message: 'Resim Cloudinary\'ye yüklenemedi (yanıt okunamadı).' }));
              throw new Error(errorData.message || `Resim Cloudinary\'ye yüklenemedi (HTTP ${uploadResponse.status}).`);
          }
          const uploadData = await uploadResponse.json(); // Başarılı ise parse et
          newPublicId = uploadData.publicId;
            // toast.success(`Resim başarıyla Cloudinary\'ye yüklendi.`); // DB kaydından sonra genel başarı mesajı

            // Eski resmi arşivleme/silme mantığı (Cloudinary'de)
            if (currentPublicIdInDb && currentPublicIdInDb !== newPublicId) {
                console.log(`Eski ${imageType} resmi (${currentPublicIdInDb}) için arşivleme/silme API'si çağrılacak.`);
                // Arşivleme API çağrısı (henüz implemente edilmedi)
                // const archiveTargetId = getArchivePublicIdForUser(currentPublicIdInDb, imageType);
                // if (archiveTargetId) {
                //   await fetch('/api/admin/cloudinary-utils/archive-image', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ publicIdToArchive: currentPublicIdInDb, archiveToPublicId: archiveTargetId })
                //   });
                // }
            }

            const dbUpdateData = imageType === 'profile' 
              ? { profileImagePublicId: newPublicId } 
              : { bannerImagePublicId: newPublicId };

          const dbResponse = await fetch('/api/profile/update-details', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dbUpdateData),
          });
          // const dbData = await dbResponse.json(); // Hata kontrolünden sonra parse et

          if (!dbResponse.ok) {
              const errorDbData = await dbResponse.json().catch(() => ({ message: 'Resim bilgisi veritabanına kaydedilemedi (yanıt okunamadı).' }));
              if (newPublicId) {
                  console.warn("DB güncellemesi başarısız, Cloudinary'ye yüklenen resim silinmeli:", newPublicId);
                    // ... (Cloudinary silme API çağrısı) ...
                }
                throw new Error(errorDbData.message || `Resim bilgisi veritabanına kaydedilemedi (HTTP ${dbResponse.status}).`);
            }
            
            toast.success(`${imageType === 'profile' ? 'Profil resmi' : 'Banner'} başarıyla güncellendi!`);

          if (imageType === 'profile') {
              setProfileImageIdToDisplay(newPublicId); // initialUser yerine state'i güncelle
              setSelectedProfileFile(null);
          } else {
              setBannerImageIdToDisplay(newPublicId); // initialUser yerine state'i güncelle
              setSelectedBannerFile(null);
          }
          router.refresh();

      } catch (error: any) {
          toast.error(error.message || 'Bir hata oluştu.');
          console.error("Resim kaydetme hatası:", error);
      } finally {
          toast.dismiss(loadingToastId);
      }
  });
};


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Banner */}
      <div className="w-full h-48 sm:h-64 md:h-80 bg-gray-300 dark:bg-gray-700 relative">
        {bannerImageIdToDisplay ? (
          <CldImage
            src={bannerImageIdToDisplay} // State'ten gelen ID
            alt={`${initialUser.username} banner resmi`}
            fill // fill={true} kullanmak genellikle daha iyi responsive sonuç verir
            className="object-cover" // fill ile object-cover iyi gider
            // width ve height propları fill varken gerekli değil, ama `sizes` eklemek iyi olur
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1500px" // Örnek sizes
            priority
            // Cloudinary'ye özel dönüşümler CldImage proplarıyla da verilebilir:
            // crop="fill" gravity="auto" format="auto" quality="auto"
            // veya getCloudinaryImageUrlOptimized'daki gibi URL'ye eklenebilir
            // next-cloudinary genellikle bunları sizin için optimize eder.
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-400/30"> {/* Placeholder için hafif bir arkaplan */}
            <PhotoIcon className="h-16 w-16 text-gray-500 opacity-50" />
          </div>
        )}
        {/* Profil Resmi Overlay'i */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10">
          <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            {profileImageIdToDisplay ? (
              <CldImage 
                src={profileImageIdToDisplay} // State'ten gelen ID
                alt={`${initialUser.username} profil fotoğrafı`} 
                fill // fill={true} kullan
                className="object-cover"
                sizes="(max-width: 128px) 128px, 128px" // Örnek sizes
                // width={128} // fill varken bunlar gerekli değil
                // height={128}
                // crop="fill" // CldImage prop'u olarak da verilebilir
              />
            ) : (
                <UserCircleIcon className="h-20 w-20 md:h-28 md:w-28 text-gray-400 dark:text-gray-500" />
            )}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden pt-16 sm:pt-20 pb-6 md:pb-8 px-6 md:px-8 mt-4">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{initialUser.username}</h1>
                <p className="text-md text-gray-600 dark:text-gray-400">{initialUser.email}</p>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{initialUser.bio}</p>
                <span className={`mt-2 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                    initialUser.role === 'admin' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                    {initialUser.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                </span>
            </div>

            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 mb-8">
                <p><strong>Kayıt Tarihi:</strong> {format(new Date(initialUser.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}</p>
                <p><strong>Son Güncelleme:</strong> {format(new Date(initialUser.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}</p>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6 border-b pb-2 dark:border-gray-700">Hesap Ayarları</h2>

            <div className="space-y-8">
                <div className="p-6 md:p-0 border-t md:border-0 border-gray-200 dark:border-gray-700 md:pt-0">
                    <ProfileImageUploader 
                        currentImagePublicId={profileImageIdToDisplay} // Güncel state'i ver
                        onFileSelect={setSelectedProfileFile}
                    />
                    {selectedProfileFile && (
                        <button 
                            onClick={() => handleImageSave('profile')} 
                            disabled={isPending} // isPending'i kullan
                            className="mt-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm disabled:opacity-50"
                        >
                            {isPending ? 'Profil Resmi Kaydediliyor...' : 'Profil Resmini Kaydet'}
                        </button>
                    )}
                </div>
                
                <div className="p-6 md:p-0 border-t border-gray-200 dark:border-gray-700">
                    <BannerImageUploader 
                        currentImagePublicId={bannerImageIdToDisplay} // Güncel state'i ver
                        onFileSelect={setSelectedBannerFile}
                    />
                     {selectedBannerFile && (
                        <button 
                            onClick={() => handleImageSave('banner')} 
                            disabled={isPending} // isPending'i kullan
                            className="mt-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm disabled:opacity-50"
                        >
                            {isPending ? 'Banner Kaydediliyor...' : 'Banner Resmini Kaydet'}
                        </button>
                    )}
                </div>
            
                <div className="p-6 md:p-0 border-t border-gray-200 dark:border-gray-700">
                    <UpdateUsernameForm currentUsername={initialUser.username} /> 
                </div>
                <div className="p-6 md:p-0 border-t border-gray-200 dark:border-gray-700">
                    <UpdateBioForm currentBio={initialUser.bio} />
                </div>
                <div className="p-6 md:p-0 border-t border-gray-200 dark:border-gray-700">
                    <UpdatePasswordForm /> 
                </div>
                <div className="p-6 md:p-0 border-t border-gray-200 dark:border-gray-700">
                    <UpdateEmailForm /> 
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}