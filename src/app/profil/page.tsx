// src/app/profil/page.tsx
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
import { UserCircleIcon } from '@heroicons/react/24/outline'; // Varsayılan avatar için

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
      profileImageUrl: true, // EKLENDİ
      createdAt: true,
      updatedAt: true,
    }
  });

  if (!user) {
    console.error("Oturumdaki kullanıcı ID'si veritabanında bulunamadı:", userId);
    redirect('/'); 
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-800 dark:text-gray-100">
        Profilim
      </h1>
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
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

          {/* Profil Fotoğrafı Yükleyici */}
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700">
            <ProfileImageUploader currentImageUrl={user.profileImageUrl} />
          </div>
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