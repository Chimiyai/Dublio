// src/app/sanatcilar/page.tsx
import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { UserCircleIcon } from 'lucide-react'; // Placeholder ikon
import { DubbingArtist } from '@prisma/client'; // Prisma tipini kullanalım

async function getArtists(): Promise<DubbingArtist[]> {
  try {
    const artists = await prisma.dubbingArtist.findMany({
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
      // İleride sadece "aktif" veya "listelenmesi onaylanmış" sanatçıları çekmek için bir `where` koşulu eklenebilir.
      // Örneğin: where: { isActive: true }
    });
    return artists;
  } catch (error) {
    console.error("Sanatçılar getirilirken hata:", error);
    return []; // Hata durumunda boş dizi döndür
  }
}

export const metadata = {
  title: 'Sanatçılar - Prestij Dublaj',
  description: 'Prestij Dublaj ekibinde yer alan tüm değerli seslendirme sanatçıları, çevirmenler ve diğer yetenekler.',
};

export default async function SanatcilarListPage() {
  const artists = await getArtists();

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
          {artists.map((artist) => {
            const artistImageUrl = artist.imageUrl;

            return (
              <Link
                href={`/sanatcilar/${artist.id}`}
                key={artist.id}
                className="group block bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 ease-in-out transform hover:-translate-y-1.5"
              >
                <div 
                  className="w-full aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden"
                  // 'relative' sınıfı artık Image için zorunlu değil.
                  // 'overflow-hidden' eklendi, Image'ın köşeleri ebeveynin yuvarlaklığını bozmasın diye (gerçi ebeveyn zaten overflow-hidden).
                >
                  {artistImageUrl ? (
                    <Image
                      src={artistImageUrl}
                      alt={`${artist.firstName} ${artist.lastName}`}
                      // fill kaldırıldı
                      // Sabit bir width/height verelim. Bu, en büyük kart boyutu veya
                      // tipik bir boyut olabilir. Örneğin 200x200.
                      width={256} // Örnek bir değer, kalite için biraz büyük tutulabilir
                      height={256} // aspect-square olduğu için aynı
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                      // 'w-full h-full' sınıfları, Image'in ebeveyninin (aspect-square olan div)
                      // alanını doldurmasını sağlar.
                      // 'object-cover' oranı korur.
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircleIcon className="w-20 h-20 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="p-4 text-center">
                  {/* ... (sanatçı adı vs.) ... */}
                  <h3 className="text-md sm:text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {artist.firstName} {artist.lastName}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}