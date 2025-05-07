import prisma from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PlusCircleIcon, UserCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline'; // PencilSquareIcon eklendi (Düzenle linki için)
import DeleteArtistButton from '@/components/admin/DeleteArtistButton'; // YENİ IMPORT

export const revalidate = 0;

async function AdminSanatcilarPage() {
  const sanatcilar = await prisma.dubbingArtist.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

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
        <p className="text-center text-gray-600 dark:text-gray-400 py-10">
          Henüz hiç sanatçı eklenmemiş.
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Sanatçı Adı
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Biyografi (Kısa)
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Eklenme Tarihi
                </th>
                <th className="px-6 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {sanatcilar.map((sanatci) => (
                <tr key={sanatci.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {sanatci.imageUrl ? (
                        <img
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                          src={sanatci.imageUrl}
                          alt={`${sanatci.firstName} ${sanatci.lastName}`}
                        />
                      ) : (
                        <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mr-3" />
                      )}
                      <div className="font-medium">{`${sanatci.firstName} ${sanatci.lastName}`}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm truncate max-w-md">
                        {sanatci.bio || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(sanatci.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2"> {/* space-x-2 eklendi */}
                    <Link
                      href={`/admin/sanatcilar/duzenle/${sanatci.id}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 inline-flex items-center"
                      title="Düzenle"
                    >
                      <PencilSquareIcon className="h-5 w-5" /> {/* Sadece ikon veya ikon + metin */}
                    </Link>
                    <DeleteArtistButton // YER TUTUCU YERİNE YENİ BUTON
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

export default AdminSanatcilarPage;
