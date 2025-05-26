// src/app/profil/[username]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
// import Image from 'next/image'; // Artık alt componentlerde
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary'; // Alt componentlerde
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
// import { format } from 'date-fns'; // Alt componentlerde
// import { tr } from 'date-fns/locale'; // Alt componentlerde
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// import { cn } from '@/lib/utils'; // cn kullanılmıyorsa kaldırılabilir

// YENİ COMPONENTLERİ IMPORT ET
import UserProfileBanner from '@/components/profile/UserProfileBanner';
import UserProfileInfo from '@/components/profile/UserProfileInfo';
import UserProfileStatsBar from '@/components/profile/UserProfileStatsBar';
// import UserProfileTabs from '@/components/profile/UserProfileTabs'; // Gelecekte
// import UserProfileContent from '@/components/profile/UserProfileContent'; // Gelecekte

interface UserProfilePageProps {
  params: {
    username: string;
  };
}

async function getUserProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username: decodeURIComponent(username) },
    select: { 
      id: true, username: true, bio: true, profileImagePublicId: true,
      bannerImagePublicId: true, createdAt: true, updatedAt: true, role: true,
    },
  });
  return user;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const session = await getServerSession(authOptions);
  const user = await getUserProfile(params.username);

  if (!user) {
    notFound();
  }
  console.log("SESSION DATA:", JSON.stringify(session, null, 2));
  console.log("PROFILE USER ID:", user.id);
  console.log("SESSION USER ID:", session?.user?.id);
  console.log("SESSION USER ROLE:", session?.user?.role);
  const isOwnProfile = (session?.user?.id?.toString() === user.id.toString()) || (session?.user?.role === 'admin');
  console.log("IS OWN PROFILE:", isOwnProfile);

  // Banner URL'ini burada oluşturup UserProfileBanner'a verelim
  const finalBannerUrl = getCloudinaryImageUrlOptimized(
  user.bannerImagePublicId,
  { 
    width: 1920,
    height: 1080,
    crop: 'fill',
    gravity: 'center',
    quality: 'auto',
    format: 'auto',
  },
  'banner'
);
  
  // Profil resmi için base boyutları UserProfileInfo'ya prop olarak geçelim
  const profileImageSizes = {
    base: { w: "w-32 sm:w-36 md:w-40 lg:w-44", h: "h-32 sm:h-36 md:h-40 lg:h-44" }, // 128, 144, 160, 176px
    // Arka plan için %10 daha büyük (yaklaşık)
    backdrop: { w: "w-36 sm:w-40 md:w-44 lg:w-[194px]", h: "h-36 sm:h-40 md:h-44 lg:h-[194px]" } // 144, 160, 176, 194px
  };
  // VEYA sayısal değerler kullanıp UserProfileInfo içinde style ile ayarlamak daha hassas olabilir.
  // Şimdilik Tailwind class'ları ile devam edelim.

  return (
    <div className="bg-profile-page-bg min-h-screen text-gray-200">
      <section className="profile-header relative">
        <UserProfileBanner 
          bannerUrl={finalBannerUrl} 
          username={user.username}
          isOwnProfile={isOwnProfile}
        />

        {/* UserProfileInfo component'i artık container içinde ve banner'a bindiriliyor */}
        {/* Bu div, UserProfileInfo'nun banner üzerine ne kadar çıkacağını ve yatay konumunu belirler */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 
                       -mt-20 sm:-mt-24 md:-mt-28 lg:-mt-32 xl:-mt-36"> 
                       {/* Negatif margin ile banner'ın üzerine bindiriyoruz, bu değeri ayarlayın */}
          <div className="flex justify-start"> {/* Sola yaslamak için */}
            <UserProfileInfo 
                user={{
                    username: user.username,
                    bio: user.bio,
                    profileImagePublicId: user.profileImagePublicId,
                }}
                isOwnProfile={isOwnProfile}
                profileImageSizes={profileImageSizes} // Boyutları prop olarak geç
            />
          </div>
        </div>
      </section>
      
      <UserProfileStatsBar user={{ createdAt: user.createdAt, updatedAt: user.updatedAt }} />

      {/* ProfileTabsSection ve ProfileContentSection Başlangıcı */}
      <section className="profile-content container mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Sol Taraf: Sekmeler (UserProfileTabs component'i gelecek) */}
          <aside className="w-full md:w-1/4 lg:w-1/5 space-y-2">
            <button className="w-full text-left px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm shadow-md transition-all">
              Genel Bakış
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white font-medium text-sm transition-colors">
              Hareketler
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white font-medium text-sm transition-colors">
              Oyun Kütüphanesi
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white font-medium text-sm transition-colors">
              Favori Oyunlar
            </button>
            <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white font-medium text-sm transition-colors">
              Favori Animeler
            </button>
            {isOwnProfile && (
              <Link href="/profil/ayarlar" className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white font-medium text-sm transition-colors flex items-center gap-2">
                <Cog6ToothIcon className="w-5 h-5"/> Hesap Ayarları
              </Link>
            )}
          </aside>

          {/* Sağ Taraf: Sekme İçeriği (UserProfileContent component'i gelecek) */}
          <main className="w-full md:w-3/4 lg:w-4/5">
            <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6">
              <h2 className="text-xl lg:text-2xl font-semibold text-white">
                Oyun Kütüphanesi {/* Bu dinamik olacak */}
              </h2>
              <span className="text-sm text-gray-400 mt-1 sm:mt-0">Toplam X Sonuç</span> {/* Bu dinamik olacak */}
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              {/* Filtreler (DropdownControl) */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5"> {/* XL'de 3 kart daha iyi olabilir */}
              {/* İçerik kartları (PopularContentCard veya benzeri) */}
              {[...Array(3)].map((_, i) => ( // Örnek placeholder kartlar
                <div key={i} className="bg-gray-800/70 rounded-lg shadow-lg aspect-[4/5]">
                  <div className="w-full h-3/5 bg-gray-700/50 rounded-t-lg"></div>
                  <div className="p-3">
                    <div className="h-4 bg-gray-600/50 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600/50 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}