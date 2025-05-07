import prisma from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import DeleteProjectButton from '@/components/admin/DeleteProjectButton'; // Yeni bileşeni import et

export default async function AdminProjelerPage() {
  console.log("--- ADMIN PROJELER SAYFASI (SİLME BUTONLU) RENDER ---");
  const projeler = await prisma.project.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... (Başlık ve Yeni Proje Ekle butonu aynı) ... */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
        Proje Yönetimi
        </h1>
        <Link
        href="/admin/projeler/yeni"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
        >
        <PlusCircleIcon className="h-5 w-5 mr-2" />
        Yeni Proje Ekle
        </Link>
      </div>


      {projeler.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          Henüz hiç proje eklenmemiş.
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            {/* ... (thead aynı) ... */}
            <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Başlık
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Tür
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Yayın Tarihi
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Durum
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-600 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                    </th>
                </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {projeler.map((proje) => (
                <tr key={proje.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                  {/* ... (diğer td'ler aynı) ... */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-medium">{proje.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{proje.slug}</p>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        proje.type === 'game' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                                            : 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100'
                    }`}>
                    {proje.type === 'game' ? 'Oyun' : 'Anime'}
                    </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm">
                    {new Date(proje.releaseDate).toLocaleDateString('tr-TR', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        proje.isPublished ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100'
                                        : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                    }`}>
                    {proje.isPublished ? 'Yayında' : 'Taslak'}
                    </span>
                </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-3">
                    <Link href={`/admin/projeler/duzenle/${proje.slug}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                      Düzenle
                    </Link>
                    <DeleteProjectButton projectSlug={proje.slug} projectTitle={proje.title} /> {/* <-- Yeni bileşeni kullan */}
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
