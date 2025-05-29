// src/components/profile/UserProfileTabs.tsx
"use client"; // Link ve ikonlar için client component olabilir, ama sadece Link kullanıyorsak Server Comp. da kalabilir.
              // Interaktifliği artırmak (örn: tıklama efekti) için "use client" daha iyi.

import Link from 'next/link';
import { Cog6ToothIcon, UserIcon, ListBulletIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
// import { usePathname, useSearchParams } from 'next/navigation'; // Aktif sekmeyi client'ta belirlemek için kullanılabilir

export type ProfileTabKey = 'overview' | 'activity' | 'library' | 'settings';

interface TabItem {
  key: ProfileTabKey;
  label: string;
  icon: React.ElementType;
  isOwnerOrAdminOnly?: boolean;
}

interface UserProfileTabsProps {
  activeTab: ProfileTabKey; // page.tsx'den (URL'den okunmuş) gelecek
  isOwnProfile: boolean;
  username: string; // Görüntülenen profilin kullanıcı adı (linkleri oluşturmak için)
}

const UserProfileTabs: React.FC<UserProfileTabsProps> = ({ 
  activeTab, 
  isOwnProfile,
  username 
}) => {
  const tabs: TabItem[] = [
    { key: 'overview', label: 'Genel Bakış', icon: UserIcon },
    { key: 'activity', label: 'Hareketler', icon: ListBulletIcon },
    { key: 'library', label: 'Oyun Kütüphanesi', icon: ShoppingBagIcon },
    { key: 'settings', label: 'Hesap Ayarları', icon: Cog6ToothIcon, isOwnerOrAdminOnly: true },
  ];

  const visibleTabs = tabs.filter(tab => !(tab.isOwnerOrAdminOnly && !isOwnProfile));

  return (
    <aside className="w-full md:w-1/4 lg:w-[22%] xl:w-1/5 space-y-1.5 md:space-y-2 flex-shrink-0">
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const commonClasses = "w-full text-left px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium text-sm flex items-center gap-2.5 sm:gap-3 transition-all duration-200 ease-in-out group";
        
        // "Hesap Ayarları" için direkt link, diğerleri için query parametreli link
        const tabHref = tab.key === 'settings' 
            ? `/profil/ayarlar` // Bu sayfanın var olduğundan emin olun
            : `/profil/${username}?tab=${tab.key}`;

        return (
            <Link
              key={tab.key}
              href={tabHref}
              scroll={false} // Sayfanın en üstüne kaydırmayı engeller, sadece içerik değişir
              className={cn(
                commonClasses,
                isActive 
                  ? "bg-purple-600 text-white shadow-md scale-[1.02]" 
                  : "text-gray-300 hover:bg-gray-700/60 hover:text-white focus-visible:bg-gray-700/60 focus-visible:text-white focus-visible:ring-2 focus-visible:ring-purple-500 outline-none"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-90")} />
              <span>{tab.label}</span>
            </Link>
        );
      })}
    </aside>
  );
};

export default UserProfileTabs;