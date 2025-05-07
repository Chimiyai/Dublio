import AddArtistForm from '@/components/admin/AddArtistForm'; // Oluşturduğumuz formu import et
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// İsteğe bağlı: Sayfa başlığı için metadata
export const metadata = {
  title: 'Yeni Sanatçı Ekle | Admin Paneli',
};

export default function YeniSanatciPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/sanatcilar" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Geri Dön (Sanatçı Listesi)
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
        Yeni Sanatçı Ekle
      </h1>
      <div className="max-w-2xl mx-auto"> {/* Formu ortalamak ve genişliğini sınırlamak için */}
        <AddArtistForm />
      </div>
    </div>
  );
}
