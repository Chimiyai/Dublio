import prisma from '@/lib/prisma';
import EditArtistForm from '@/components/admin/EditArtistForm'; // Form bileşenimiz
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation'; // Sanatçı bulunamazsa 404 için

interface EditSanatciPageProps {
  params: {
    artistId: string;
  };
}

// İsteğe bağlı: Sayfa başlığı için dinamik metadata
export async function generateMetadata({ params }: EditSanatciPageProps) {
  const artistId = parseInt(params.artistId, 10);
  if (isNaN(artistId)) {
    return { title: 'Sanatçı Bulunamadı | Admin Paneli' };
  }
  const artist = await prisma.dubbingArtist.findUnique({
    where: { id: artistId },
    select: { firstName: true, lastName: true },
  });

  if (!artist) {
    return { title: 'Sanatçı Bulunamadı | Admin Paneli' };
  }
  return {
    title: `Düzenle: ${artist.firstName} ${artist.lastName} | Admin Paneli`,
  };
}

export default async function EditSanatciPage({ params }: EditSanatciPageProps) {
  const artistId = parseInt(params.artistId, 10);

  if (isNaN(artistId)) {
    return ( // Veya direkt notFound() çağrılabilir
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Geçersiz Sanatçı ID</h1>
        <p className="text-gray-600">Lütfen geçerli bir ID ile tekrar deneyin.</p>
        <Link href="/admin/sanatcilar" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
          Sanatçı Listesine Geri Dön
        </Link>
      </div>
    );
  }

  const artist = await prisma.dubbingArtist.findUnique({
    where: { id: artistId },
  });

  if (!artist) {
    notFound(); // Next.js'in kendi 404 sayfasını gösterir
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/sanatcilar" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Geri Dön (Sanatçı Listesi)
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
        Sanatçı Düzenle: <span className="text-indigo-600">{`${artist.firstName} ${artist.lastName}`}</span>
      </h1>
      <div className="max-w-2xl mx-auto">
        <EditArtistForm artist={artist} />
      </div>
    </div>
  );
}
