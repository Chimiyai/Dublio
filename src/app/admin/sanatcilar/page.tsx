// src/app/admin/sanatcilar/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PlusCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import DeleteArtistButton from '@/components/admin/DeleteArtistButton';
// import { CldImage } from 'next-cloudinary'; // KALDIRILDI
// import { UserCircleIcon } from '@heroicons/react/24/solid'; // KALDIRILDI (AdminArtistAvatar içinde)
import AdminArtistAvatar from '@/components/admin/AdminArtistAvatar'; // YENİ IMPORT

export const revalidate = 0;

interface ArtistForAdminList {
  id: number;
  firstName: string;
  lastName: string;
  bio: string | null;
  imagePublicId: string | null;
  createdAt: Date;
}

export default async function AdminSanatcilarPage() {
  const sanatcilar = await prisma.dubbingArtist.findMany({
    orderBy: { createdAt: 'desc' },
    select: { 
      id: true,
      firstName: true,
      lastName: true,
      bio: true,
      imagePublicId: true,
      createdAt: true,
    }
  }) as ArtistForAdminList[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Sanatçı Yönetimi
        </h1>
        <Link
          href="/admin/sanatcilar/yeni"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Yeni Sanatçı Ekle
        </Link>
      </div>

      {sanatcilar.length === 0 ? (
        <p /* ... */ >Henüz hiç sanatçı eklenmemiş.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead /* ... */ >
              {/* ... (tablo başlıkları) ... */}
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {sanatcilar.map((sanatci) => (
                <tr key={sanatci.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 mr-3">
                        <AdminArtistAvatar 
                          publicId={sanatci.imagePublicId}
                          altText={`${sanatci.firstName} ${sanatci.lastName}`}
                          size={40} // Tablo için uygun boyut
                          className="rounded-full" // Avatarın yuvarlak olmasını sağlar
                        />
                      </div>
                      <div className="font-medium">{`${sanatci.firstName} ${sanatci.lastName}`}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm truncate max-w-xs sm:max-w-md">
                        {sanatci.bio || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(sanatci.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    {/* ... (Düzenle ve Sil butonları) ... */}
                    <Link
                      href={`/admin/sanatcilar/duzenle/${sanatci.id}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 inline-flex items-center"
                      title="Düzenle"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </Link>
                    <DeleteArtistButton
                      artistId={sanatci.id}
                      artistFullName={`${sanatci.firstName} ${sanatci.lastName}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}