// src/components/layout/NotificationBell.tsx
'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import Link from 'next/link';
import useSWR from 'swr';
import { BellIcon, PhotoIcon } from '@heroicons/react/24/outline';
import NextImage from 'next/image';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSWRConfig } from 'swr';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';

// --- GÜNCELLENMİŞ TİPLER ---
interface Notification {
  id: number;
  message: string;
  link: string;
  createdAt: string;
}
interface ProjectImages {
  cover: string | null;
  banner: string | null;
}
interface UserNotification {
  id: number;
  isRead: boolean;
  notification: Notification;
  projectImages: ProjectImages | null; // Yeni alan
}
interface NotificationsResponse {
  notifications: UserNotification[];
  unreadCount: number;
}
// ----------------------------

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate } = useSWRConfig();
  const { data, error } = useSWR<NotificationsResponse>('/api/notifications', fetcher, { refreshInterval: 60000 });
  // Hem butonu hem de dropdown menüsünü içerecek olan ana sarmalayıcı için ref
  const wrapperRef = useRef<HTMLDivElement>(null); 
  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  // --- handleOpen fonksiyonunu basitleştiriyoruz ---
  const handleToggle = () => {
    const newIsOpenState = !isOpen;
    setIsOpen(newIsOpenState);

    // Sadece menü AÇILIRKEN ve okunmamış bildirim varsa okundu olarak işaretle
    if (newIsOpenState && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic UI
      mutate('/api/notifications', { ...data, unreadCount: 0 }, false);
      // API isteği
      await fetch('/api/notifications', { method: 'POST' });
      // Veriyi yeniden doğrula
      mutate('/api/notifications');
    } catch (err) {
      console.error("Bildirimler okundu olarak işaretlenemedi:", err);
      mutate('/api/notifications'); // Hata durumunda eski veriyi geri getir
    }
  };
  
  // --- Dışarıya tıklama hook'unu güncelliyoruz ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Eğer tıklanan yer, sarmalayıcı div'in (wrapperRef) içinde değilse menüyü kapat.
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // Her zaman dinleyiciyi ekle
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup fonksiyonu
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]); // Ref'i bağımlılığa eklemeye gerek yok, sadece bir kez çalışması yeterli.

  return (
    // Ana sarmalayıcı div, ref'i burada kullanıyoruz
    <div className="relative text-prestij-text-accent hover:text-prestij-purple transition-colors p-1 mt-1 mr-2 rounded-full hover:bg-prestij-purple/10" ref={wrapperRef}>
      {/* Zil İkonu Butonu */}
      <button
        onClick={handleToggle} // Artık yeni toggle fonksiyonunu çağırıyor
        className="notification-bell ..."
        aria-label={`Bildirimler (${unreadCount} okunmamış)`}
      >
        <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-prestij-dark-900" />
        )}
      </button>

      {/* Animasyonlu Dropdown Menü */}
      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95 -translate-y-2" // Başlangıç: Yukarıda, küçük ve şeffaf
        enterTo="transform opacity-100 scale-100 translate-y-0"   // Bitiş: Normal boyut ve görünür
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100 translate-y-0" // Başlangıç: Normal boyut ve görünür
        leaveTo="transform opacity-0 scale-95 -translate-y-2"   // Bitiş: Yukarıda, küçük ve şeffaf
      >
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-prestij-sidebar-bg rounded-lg shadow-2xl border border-prestij-border-dark z-50"
        >
          <div className="p-3 border-b border-prestij-border-dark flex justify-between items-center">
            <h3 className="font-semibold text-white">Bildirimler</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-prestij-border-dark scrollbar-track-transparent">
            {notifications.length > 0 ? (
              // --- YENİ BİLDİRİM TASARIMI ---
              <div className="flex flex-col">
                {notifications.map((userNotif) => {
                  const coverUrl = getCloudinaryImageUrlOptimized(
                    userNotif.projectImages?.cover,
                    { 
                      width: 128,  // Eskisi 80'di, 128'e çıkardık
                      height: 160, // Eskisi 100'dü, 160'a çıkardık (orantılı olarak)
                      crop: 'fill', 
                      gravity: 'face',
                      quality: 'auto', // Cloudinary'nin en iyi kaliteyi seçmesini sağlar
                      format: 'auto'   // Cloudinary'nin en iyi formatı (webp, avif) seçmesini sağlar
                    },
                    'cover'
                  );
                  const bannerUrl = getCloudinaryImageUrlOptimized(
                    userNotif.projectImages?.banner,
                    { width: 400, height: 100, crop: 'fill', gravity: 'auto', quality: 'auto' },
                    'banner'
                  );
                  
                  return (
                    <Link
                      key={userNotif.id}
                      href={userNotif.notification.link}
                      onClick={() => setIsOpen(false)}
                      className="relative block p-3 group border-b border-prestij-border-dark/50 overflow-hidden"
                    >
                      {/* Arka Plan Banner Resmi */}
                      {bannerUrl && (
                        <NextImage
                          src={bannerUrl}
                          alt=""
                          fill
                          className="absolute inset-0 object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-300 z-0"
                          aria-hidden="true"
                        />
                      )}
                      {/* Arka Plan Gradyan (Banner üzerine) */}
                      <div className="absolute inset-0 bg-gradient-to-r from-prestij-sidebar-bg via-prestij-sidebar-bg/80 to-transparent z-10"></div>
                      
                      {/* İçerik */}
                      <div className="relative z-20 flex items-center gap-4">
                        {/* Sol Kapak Resmi */}
                        <div className="flex-shrink-0 w-16 h-20 bg-gray-800 rounded-md overflow-hidden shadow-md">
                          {coverUrl ? (
                            <NextImage src={coverUrl} alt="Proje Kapağı" width={64} height={80} className="object-cover w-full h-full" />
                          ) : (
                            <PhotoIcon className="w-full h-full text-gray-600 p-2" />
                          )}
                        </div>
                        
                        {/* Sağ Metin Alanı */}
                        <div className="flex-grow min-w-0">
                          <p className="text-sm text-prestij-text-primary leading-tight font-medium group-hover:text-prestij-purple transition-colors">
                            {userNotif.notification.message}
                          </p>
                          <p className="text-xs text-prestij-text-muted mt-1.5">
                            {formatDistanceToNowStrict(new Date(userNotif.notification.createdAt), {
                              locale: tr,
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        
                        {/* Okunmadı Noktası */}
                        {!userNotif.isRead && (
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full self-start mt-1 flex-shrink-0"></div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-10 px-4 text-sm">Hiç bildiriminiz yok.</p>
            )}
          </div>
        </div>
      </Transition>
    </div>
  );
}