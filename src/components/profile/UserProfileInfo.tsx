// src/components/profile/UserProfileInfo.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Yönlendirme için useRouter hook'unu import et
import { useState } from 'react'; // Loading state'i için useState'i import et
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { UserCircleIcon, PencilSquareIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast'; // Geri bildirim için

interface ProfileImageSizes {
  base: { w: string; h: string };
  backdrop: { w: string; h: string };
}

interface UserProfileInfoProps {
  user: {
    id: number; // <<--- KULLANICI ID'Sİ ARTIK ZORUNLU
    username: string;
    bio: string | null;
    profileImagePublicId: string | null;
  };
  isOwnProfile: boolean;
  profileImageSizes: ProfileImageSizes;
}

const UserProfileInfo: React.FC<UserProfileInfoProps> = ({
  user,
  isOwnProfile,
  profileImageSizes,
}) => {
  const router = useRouter(); // useRouter hook'unu kullan
  const [isLoading, setIsLoading] = useState(false); // Buton için yükleniyor durumu

  const profileImageId = user.profileImagePublicId;
  const defaultBio = "Selam ;)";

  const handleSendMessage = async () => {
    setIsLoading(true);
    // Bu fonksiyon, bir sohbet başlatmak veya mevcut sohbete gitmek için API'ye istek gönderecek.
    // En basit yöntem, direkt olarak sohbet sayfasına yönlendirmektir.
    // Sohbet sayfanızın URL yapısının /mesajlar/[userId] olduğunu varsayıyorum.
    // [userId], mesaj gönderilecek kişinin ID'sidir.

    try {
      // Normalde burada bir API çağrısı ile arka planda sohbet oluşturulur veya kontrol edilir.
      // const response = await fetch('/api/messages/conversations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ recipientId: user.id }),
      // });
      // const data = await response.json();
      // if (!response.ok) {
      //   throw new Error(data.message || 'Sohbet başlatılamadı.');
      // }
      
      // Şimdilik API çağrısını atlayıp doğrudan yönlendirme yapalım.
      // Mesajlar sayfası, gerekirse sohbetin varlığını kendi içinde kontrol edebilir.
      // VEYA API çağrısı başarılı olduktan sonra yönlendirme yapılır.

      router.push(`/mesajlar/${user.id}`);

    } catch (error) {
      toast.error((error as Error).message || 'Bir hata oluştu.');
      setIsLoading(false); // Hata durumunda yükleniyor durumunu kapat
    }
    // Yönlendirme sonrası setIsLoading(false) demeye gerek yok, çünkü sayfa değişmiş olacak.
  };

  return (
    <div className="flex flex-col items-start gap-4">
      {/* Profil Resmi ve Kullanıcı Adı Row */}
      <div className="flex items-center gap-4 md:gap-5">
        {/* Profil Resmi Grubu */}
        <div className="relative flex-shrink-0"> {/* Bu div ön ve arka resmi sarmalayacak */}
          {/* Arka Plan/Gölge Profil Resmi */}
          {profileImageId && (
            <div
              className={cn(
                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2", // Tam ortaya almak için
                profileImageSizes.backdrop.w, // Dinamik boyut (ön resimden büyük)
                profileImageSizes.backdrop.h, // Dinamik boyut
                "bg-black rounded-xl shadow-profile-image-glow-white z-0" // Kenarları yuvarlak, glow
              )}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <Image
                // Arka plan için ön resimden biraz daha yüksek çözünürlük isteyebiliriz
                src={getCloudinaryImageUrlOptimized(profileImageId, { width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto', format: 'auto' }, 'avatar')}
                alt=""
                fill
                className="object-cover grayscale opacity-60 rounded-xl" // Kenarları yuvarlak
                sizes="(max-width: 768px) 220px, 280px" // Responsive sizes güncellendi
              />
            </div>
          )}

          {/* Ön Profil Resmi (Keskin Köşeli) */}
          <div
            className={cn(
              "relative z-10", // Arka plan resminin üzerinde olması için
              profileImageSizes.base.w, // Dinamik boyut
              profileImageSizes.base.h, // Dinamik boyut
              "bg-gray-700 overflow-hidden", // Kenarlık yok, köşe yuvarlaklığı yok
              "flex items-center justify-center"
            )}
          >
            {profileImageId ? (
              <Image
                src={getCloudinaryImageUrlOptimized(
                  profileImageId, 
                  { 
                    width: 400, // Boyutu artırıldı
                    height: 400, // Boyutu artırıldı
                    crop: 'fill',
                    gravity: 'face',
                    quality: 'auto', // Otomatik kalite optimizasyonu
                    format: 'auto' // Otomatik format optimizasyonu
                  }, 
                  'avatar'
                )}
                alt={`${user.username} profil resmi`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 192px, 256px" // Responsive sizes güncellendi
                priority // LCP için öncelikli yükleme
              />
            ) : (
              <UserCircleIcon className="w-full h-full text-gray-500 p-2" />
            )}
          </div>
          {/* Profili Düzenle butonu kullanıcı adının üstünde olacak */}
        </div>

        {/* Kullanıcı Adı ve Düzenle Butonu */}
        <div className="flex flex-col justify-center min-w-0">
          {isOwnProfile && (
            <Link
              href="/profil"
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white 
                       bg-black/40 hover:bg-black/60 px-2.5 py-1 rounded-md transition-colors
                       w-fit mb-1.5"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
              <span>Düzenle</span>
            </Link>
          )}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white break-words truncate 
                       [text-shadow:_1px_2px_2px_rgba(0,0,0,0.5)]">
            {user.username}
          </h1>
        </div>
      </div>

      {/* Biyografi - Artık profil resminin altında */}
      <div className="w-full max-w-2xl pt-2">
        <p className="text-sm sm:text-base text-[#B1B1B1] leading-relaxed 
                     [text-shadow:_0_1px_2px_rgba(0,0,0,0.4)]">
          {user.bio || defaultBio}
        </p>
      </div>

      {/* Mesaj Gönder Butonu - Artık işlevsel */}
      {!isOwnProfile && (
        <button 
          onClick={handleSendMessage}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors mt-2",
            isLoading && "opacity-70 cursor-not-allowed" // Yüklenirken stil
          )}
        >
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
          {isLoading ? 'Yönlendiriliyor...' : 'Mesaj Gönder'}
        </button>
      )}
    </div>
  );
};

export default UserProfileInfo;