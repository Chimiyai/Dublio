// src/app/sanatcilar/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import ArtistAvatar from '@/components/ArtistAvatar'; // Client Component

export const metadata = {
  title: 'Sanatçılar - Dublio Dublaj',
  description: 'Dublio Dublaj ekibinde yer alan tüm değerli seslendirme sanatçıları, çevirmenler ve diğer yetenekler.',
};

// Sanatçı listesi için tip
type ArtistForListPage = {
  id: number;
  firstName: string;
  lastName: string;
  imagePublicId: string | null; // Artık imagePublicId
};

export default async function SanatcilarListPage() {
  const artists = await prisma.dubbingArtist.findMany({
    orderBy: [ { firstName: 'asc' }, { lastName: 'asc' } ],
    select: { // Sadece gerekli alanları seç
      id: true,
      firstName: true,
      lastName: true,
      imagePublicId: true, // imageUrl yerine imagePublicId
    }
  }) as ArtistForListPage[];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
          Ekibimiz
        </h1>
        <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Projelerimize hayat veren yetenekli sanatçılarımızla tanışın.
        </p>
      </div>

      {artists.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
          Şu anda listelenecek sanatçı bulunmamaktadır.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {artists.map((artist) => (
            <Link
              href={`/sanatcilar/${artist.id}`}
              key={artist.id}
              className="group block bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 ease-in-out transform hover:-translate-y-1.5"
            >
              <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700"> {/* Placeholder için bg eklendi */}
                <ArtistAvatar 
                  publicId={artist.imagePublicId}
                  altText={`${artist.firstName} ${artist.lastName}`}
                  size={256} // Kartın tamamını kaplayacak şekilde büyük bir boyut verelim, CldImage küçültecek
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-md sm:text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {artist.firstName} ${artist.lastName}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}