// src/app/profil/[username]/page.tsx
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptions yolunu kendi projenize göre güncelleyin
import ArtistAvatar from '@/components/ArtistAvatar'; // Kullanıcı avatarı için, yoksa basit bir <img> kullanabilirsiniz
import { Metadata } from 'next';
import { MessageCircle, UserCircle2, CalendarDays } from 'lucide-react'; // İkonlar için

interface UserProfilePageProps {
  params: {
    username: string;
  };
}

// Dinamik metadata oluşturmak için
export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { username: true /*, bio: true */ }, // SEO için bio da eklenebilir
  });

  if (!user) {
    return {
      title: 'Kullanıcı Bulunamadı',
    };
  }

  return {
    title: `${user.username} Profili | Prestij Dublaj`,
    description: `${user.username} kullanıcısının profil sayfası.`, // Daha zengin bir açıklama eklenebilir
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;

  const user = await prisma.user.findUnique({
    where: {
      username: params.username,
    },
    select: {
      id: true,
      username: true,
      email: false, // E-postayı herkese açık göstermeyelim
      profileImagePublicId: true,
      role: true,
      createdAt: true,
      // bannerImagePublicId: true, // Eğer banner varsa
      // bio: true, // Eğer biyografi alanı varsa
    },
  });

  if (!user) {
    notFound(); // Kullanıcı bulunamazsa 404 sayfası göster
  }

  const isOwnProfile = currentUserId === user.id;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-10">
        {/* Banner Alanı (Opsiyonel) */}
        {/* {user.bannerImagePublicId && (
          <div className="relative h-48 md:h-64 rounded-t-lg overflow-hidden -m-6 md:-m-10 mb-6 md:mb-10">
            <Image src={`CLOUDINARY_URL/${user.bannerImagePublicId}`} alt={`${user.username} banner`} layout="fill" objectFit="cover" />
          </div>
        )} */}

        <div className="flex flex-col items-center md:flex-row md:items-start">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-indigo-500 dark:border-indigo-400 mb-6 md:mb-0 md:mr-8 flex-shrink-0">
            <ArtistAvatar // Veya genel bir UserAvatar component'i
              publicId={user.profileImagePublicId}
              altText={`${user.username} profil fotoğrafı`}
              size={160} // md:w-40 md:h-40 için
            />
          </div>

          <div className="text-center md:text-left flex-grow">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {user.username}
            </h1>
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4 ${
                user.role === 'admin'
                ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100'
            }`}>
              {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
            </span>

            {/* Biyografi Alanı (Opsiyonel) */}
            {/* {user.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">{user.bio}</p>
            )} */}

            <div className="flex items-center justify-center md:justify-start text-sm text-gray-500 dark:text-gray-400 mb-6">
              <CalendarDays className="h-4 w-4 mr-2" />
              <span>
                Katılma Tarihi: {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {!isOwnProfile && session && (
              <Link
                href={`/mesajlar/${user.id}`} // Kullanıcının ID'si ile mesajlar sayfasına yönlendir
                className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Mesaj Gönder
              </Link>
            )}
            {isOwnProfile && (
                 <Link
                    href="/hesap-ayarlari" // Kendi profilindeyse hesap ayarlarına git
                    className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                >
                    <UserCircle2 className="h-5 w-5 mr-2" />
                    Profili Düzenle
                </Link>
            )}
          </div>
        </div>

        {/* Kullanıcının Aktiviteleri (Gelecekte Eklenebilir) */}
        {/* <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Son Aktiviteler</h2>
          <p className="text-gray-600 dark:text-gray-400">Kullanıcının yorumları, beğendiği projeler vb. burada listelenebilir.</p>
        </div> */}
      </div>
    </div>
  );
}