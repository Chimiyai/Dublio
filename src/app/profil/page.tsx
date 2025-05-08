import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma'; 
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ProfileImageUploader from '@/components/profile/ProfileImageUploader';
import UpdateUsernameForm from '@/components/profile/UpdateUsernameForm';
import UpdatePasswordForm from '@/components/profile/UpdatePasswordForm';
import UpdateEmailForm from '@/components/profile/UpdateEmailForm';
import BannerImageUploader from '@/components/profile/BannerImageUploader'; 
import { UserCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CldImage } from 'next-cloudinary';

export const metadata = {
  title: 'Profilim | Prestij Dublaj',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect('/giris?callbackUrl=/profil');
  }

  const userId = parseInt(session.user.id, 10); 
  if (isNaN(userId)) {
       console.error("Profil sayfasında geçersiz kullanıcı ID'si:", session.user.id);
       redirect('/'); 
  }

  // Kullanıcı bilgilerini çekerken profileImageUrl'u da ekle
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      profileImageUrl: true, 
      bannerImageUrl: true, // EKLENDİ
      createdAt: true,
      updatedAt: true,
    }
  });

  if (!user) {
    console.error("Oturumdaki kullanıcı ID'si veritabanında bulunamadı:", userId);
    redirect('/'); 
  }

  return (
    // Ana container'dan padding'i kaldırıp banner'ı tam genişlik yapabiliriz
    <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-12"> 
      
{/* --- BANNER ALANI (img ile) --- */}
<div className="w-full h-48 ... relative ...">
          {user.bannerImageUrl ? (
              <img 
                 src={user.bannerImageUrl} // Doğrudan URL
                 alt={`${user.username} banner resmi`}
                 className="object-cover w-full h-full" 
                 // Next.js Image bileşeni veya 'loading="lazy"' daha iyi olabilir
              />
          ) : (
              <div className="flex items-center justify-center h-full bg-gray-300 dark:bg-gray-700"> {/* Arka plan rengi ekle */}
                 <PhotoIcon className="h-16 w-16 text-gray-500 dark:text-gray-400" />
             </div>
          )}
          {/* Banner üzerine profil resmi bindirme */}
          <div className="absolute ...">
               {user.profileImageUrl ? (
                      <img 
                          src={user.profileImageUrl} // Doğrudan URL
                          alt={`${user.username} profil fotoğrafı`}
                          className="h-24 w-24 ... rounded-full object-cover ..."
                      />
                  ) : (
                      <UserCircleIcon className="h-24 w-24 ..." />
                  )}
          </div>
      </div>
      {/* -------------------- */}
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-b-lg shadow-xl overflow-hidden pt-16 pb-6 md:pb-8 px-6 md:px-8 -mt-12 md:-mt-14 relative z-10">
          {/* Profil Resmi ve Bilgiler Yan Yana (Örnek Düzen) */}
          <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profil Resmi Alanı */}
              <div className="flex-shrink-0">
                  {user.profileImageUrl ? (
                      <img // Burada CldImage yerine basit img kullanabiliriz, URL zaten tam
                          src={user.profileImageUrl} 
                          alt={`${user.username} profil fotoğrafı`}
                          className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                      />
                  ) : (
                      <UserCircleIcon className="h-24 w-24 md:h-32 md:w-32 text-gray-400 dark:text-gray-500" />
                  )}
              </div>
              {/* Bilgiler Alanı */}
              <div className="flex-grow space-y-3 text-center sm:text-left">
                   <div className="flex flex-col">
                      <strong className="text-gray-600 dark:text-gray-400 text-sm">Kullanıcı Adı:</strong>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-200">{user.username}</span>
                    </div>
                     <div className="flex flex-col">
                        <strong className="text-gray-600 dark:text-gray-400 text-sm">E-posta:</strong>
                        <span className="text-gray-900 dark:text-gray-200">{user.email}</span>
                      </div>
                     <div className="flex flex-col">
                       <strong className="text-gray-600 dark:text-gray-400 text-sm">Rol:</strong>
                        <span className={`mt-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                              {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                            </span>
                     </div>
                     <div className="flex flex-col">
                        <strong className="text-gray-600 dark:text-gray-400 text-sm">Kayıt Tarihi:</strong>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {format(new Date(user.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                        </span>
                      </div>
                       <div className="flex flex-col">
                        <strong className="text-gray-600 dark:text-gray-400 text-sm">Son Güncelleme:</strong>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {format(new Date(user.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                        </span>
                      </div>
              </div>
          </div>
          {/* Ayarlar Bölümü */}
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Profil Ayarları</h2>

          {/* Profil Fotoğrafı Yükleyici */}
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700">
            <ProfileImageUploader currentImageUrl={user.profileImageUrl} />
          </div>
          {/* --- BANNER YÜKLEYİCİ --- */}
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700">
               <BannerImageUploader currentImageUrl={user.bannerImageUrl} /> 
           </div>
           {/* ----------------------- */}
           {/* --- KULLANICI ADI GÜNCELLEME FORMU --- */}
           <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700">
            <UpdateUsernameForm currentUsername={user.username} /> 
          </div>
          {/* ---------------------------------------- */}
          {/* --- ŞİFRE GÜNCELLEME FORMU --- */}
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700">
            <UpdatePasswordForm /> 
          </div>
          {/* ----------------------------- */}
          {/* --- E-POSTA GÜNCELLEME FORMU --- */}
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700">
            <UpdateEmailForm /> 
          </div>
          {/* --------------------------------- */}
            {/* --- Diğer Güncelleme Formları Buraya Gelecek --- */}
          {/* <div className="p-6 md:p-8 mt-0 pt-0 border-t border-gray-200 dark:border-gray-700">
             <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Diğer Ayarlar (Yakında)</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400">E-posta veya şifre güncelleme özellikleri.</p>
          </div> */}
           {/* -------------------------------------------------------- */}


      </div>
    </div>
  );
}