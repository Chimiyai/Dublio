// src/app/animeler/[slug]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import NextImage from 'next/image';
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Metadata } from 'next';

// İkonlar
import { PlayCircleIcon, StarIcon, PhotoIcon as PagePhotoIcon } from '@heroicons/react/24/solid';
import ProjectInteractionButtons, { ProjectInteractionButtonsProps } from '@/components/project/ProjectInteractionButtons';
// AnimeTabs ve AnimeDataForTabs tipleri için doğru yolu kullanın
import AnimeTabs, { AnimeDataForTabs, CategoryForAnimePage } from '@/components/animes/AnimeTabs'; // AnimeTabs ve tipleri için

interface AnimeDetailPageProps {
  params: { slug: string };
}

// Bu fonksiyon AnimeDataForTabs tipini döndürmeli
async function getAnimeDetails(slug: string): Promise<AnimeDataForTabs | null> {
  const animeData = await prisma.project.findUnique({ // animeData olarak değiştirdim
    where: { slug: decodeURIComponent(slug), type: 'anime' },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true, // Bunu kontrol edip AnimeDataForTabs'a ekleyebiliriz
      description: true,
      bannerImagePublicId: true,
      coverImagePublicId: true,
      releaseDate: true,
      externalWatchUrl: true, // Anime için önemli
      likeCount: true,
      dislikeCount: true,
      favoriteCount: true,
      categories: { 
        orderBy: { category: { name: 'asc' } },
        select: { category: { select: { name: true, slug: true } } } 
      },
      assignments: {
        orderBy: [ { role: 'asc'}, { artist: { lastName: 'asc' } } ],
        select: {
          id: true,
          role: true,
          artist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imagePublicId: true,
            }
          },
          voiceRoles: {
            orderBy: { character: { name: 'asc' } },
            select: {
              character: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      },
      _count: { select: { comments: true } },
    }
  });

  if (!animeData) return null;

  // Prisma'dan dönen tipi AnimeDataForTabs'a map'leyelim
  // Bu, tipler arasında tam uyum sağlamak için önemlidir.
  const formattedAnime: AnimeDataForTabs = {
    id: animeData.id,
    slug: animeData.slug,
    title: animeData.title,
    description: animeData.description,
    type: animeData.type as 'anime', // type'ı 'anime' olarak kesinleştiriyoruz
    bannerImagePublicId: animeData.bannerImagePublicId,
    coverImagePublicId: animeData.coverImagePublicId,
    releaseDate: animeData.releaseDate,
    externalWatchUrl: animeData.externalWatchUrl, // Eklendi
    likeCount: animeData.likeCount,
    dislikeCount: animeData.dislikeCount,
    favoriteCount: animeData.favoriteCount,
    categories: animeData.categories as CategoryForAnimePage[], // Tip cast
    assignments: animeData.assignments.map(a => ({ // Tip eşleşmesi için map'leme
        id: a.id,
        role: a.role,
        artist: a.artist,
        voiceRoles: a.voiceRoles.map(vr => ({
            character: vr.character,
        }))
    })),
    _count: animeData._count,
  };
  return formattedAnime;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) {
    return { title: 'Geçersiz İstek' }; // Veya daha uygun bir başlık
  }
  const anime = await getAnimeDetails(slug);
  if (!anime) return { title: 'Anime Bulunamadı' };
  return {
    title: `${anime.title} Türkçe Dublaj İzle | PrestiJ Studio`, // Başlık güncellendi
    description: anime.description?.substring(0, 160) || `PrestiJ Studio tarafından Türkçe dublajı yapılan ${anime.title} animesini keşfedin.`, // Açıklama güncellendi
  };
}

export default async function AnimeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) {
    notFound(); // Veya kullanıcıyı başka bir sayfaya yönlendir
  }

  const session = await getServerSession(authOptions);
  const anime = await getAnimeDetails(slug);

  if (!anime) {
    notFound();
  }

  let userInitialInteraction: ProjectInteractionButtonsProps['userInitialInteraction'] = {
    liked: false, disliked: false, favorited: false,
  };

  if (session?.user?.id) {
    const userId = parseInt(session.user.id);
    // userHasAnime kontrolü animeler için gereksiz
    // const userHasAnime = !!await prisma.userOwnedAnime.findUnique({
    //   where: { userId_projectId: { userId, projectId: anime.id } } // anime.id kullanıldı
    // });

    const [likedEntry, dislikedEntry, favoritedEntry] = await Promise.all([
      prisma.projectLike.findUnique({ where: { userId_projectId: { userId, projectId: anime.id } } }), // anime.id
      prisma.projectDislike.findUnique({ where: { userId_projectId: { userId, projectId: anime.id } } }), // anime.id
      prisma.projectFavorite.findUnique({ where: { userId_projectId: { userId, projectId: anime.id } } }), // anime.id
    ]);
    userInitialInteraction = {
      liked: !!likedEntry,
      disliked: !!dislikedEntry,
      favorited: !!favoritedEntry,
    };
  }

  const bannerUrl = getCloudinaryImageUrlOptimized(
    anime.bannerImagePublicId, // anime değişkeni kullanıldı
    { width: 1920, height: 700, crop: 'fill', gravity: 'auto' },
    'banner'
  );
  const coverUrl = getCloudinaryImageUrlOptimized(
    anime.coverImagePublicId, // anime değişkeni kullanıldı
    { width: 200, height: 280, crop: 'fill', gravity: 'face' }, // Kapak için gravity: 'face' eklenebilir
    'cover'
  );

  const totalVotes = (anime.likeCount || 0) + (anime.dislikeCount || 0);
  const likePercentage = totalVotes > 0 ? Math.round(((anime.likeCount || 0) / totalVotes) * 100) : 0;

  return (
    <div className="bg-prestij-chat-bg min-h-screen text-gray-300">
      <section className="relative w-full h-[70vh] sm:h-[80vh] md:h-[85vh] overflow-hidden">
        {anime.bannerImagePublicId ? ( // anime değişkeni
          <NextImage src={bannerUrl} alt={`${anime.title} Banner`} fill className="object-cover object-center" priority sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center"><PagePhotoIcon className="w-24 h-24 text-gray-500"/></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent z-[1]"></div> {/* Gradyan ayarlandı */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-prestij-chat-bg via-prestij-chat-bg/80 to-transparent z-[2]"></div>
        
        <div className="absolute inset-0 container mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-16 md:pb-20 z-[3]"> {/* items-end ve pb eklendi */}
          <div className="w-full md:w-3/5 lg:w-1/2 xl:w-2/5"> {/* Genişlik ayarlandı */}
            <div className="bg-black/60 dark:bg-prestij-dark-850/80 backdrop-blur-lg p-5 sm:p-6 rounded-xl shadow-2xl">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="relative w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-44 flex-shrink-0 rounded-lg overflow-hidden shadow-lg border-2 border-white/10">
                  {anime.coverImagePublicId ? ( // anime değişkeni
                    <NextImage src={coverUrl} alt={`${anime.title} Kapağı`} fill className="object-cover" sizes="(max-width: 768px) 112px, 128px" />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center"><PagePhotoIcon className="w-12 h-12 text-gray-400"/></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 [text-shadow:_1px_2px_3px_rgb(0_0_0_/_0.6)]">
                        {anime.title} {/* anime değişkeni */}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-300 line-clamp-3 sm:line-clamp-4 mb-3 sm:mb-4 leading-relaxed">
                        {anime.description || "Açıklama yakında eklenecek."} {/* anime değişkeni */}
                    </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <ProjectInteractionButtons
                    projectId={anime.id}
                    initialLikeCount={anime.likeCount}
                    initialDislikeCount={anime.dislikeCount}
                    initialFavoriteCount={anime.favoriteCount}
                    userInitialInteraction={userInitialInteraction}
                    isUserLoggedIn={!!session?.user?.id}
                />
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 right-4 sm:right-6 lg:right-8 z-[3] text-right space-y-4"> {/* space-y artırıldı */}
            {totalVotes > 0 && (
                <div className="bg-black/40 backdrop-blur-sm p-2 rounded-md inline-block">
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className={`w-4 h-4 ${i * 20 < likePercentage ? 'text-yellow-400' : 'text-gray-600'}`} />
                        ))}
                        <span className="text-xs text-white ml-1">({likePercentage}%)</span>
                    </div>
                </div>
            )}
            <div>
              {anime.externalWatchUrl ? (
                <Link 
                    href={anime.externalWatchUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-prestij-500 hover:bg-prestij-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <PlayCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  Hemen İzle
                </Link>
              ) : (
                <span className="inline-block bg-gray-700 text-gray-300 px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg cursor-not-allowed">
                  Yakında...
                </span>
              )}
            </div>
             <div className="text-xs text-gray-300 [text-shadow:_0_1px_1px_rgb(0_0_0_/_0.5)]">
              Tür: {anime.categories.map((c: { category: { name: string } }) => c.category.name).join(', ') || 'Belirtilmemiş'} 
              <br className="hidden sm:block" /> {/* Mobil için alt satıra geçebilir */}
              Yayın: {anime.releaseDate ? format(new Date(anime.releaseDate), 'dd MMM yyyy', {locale: tr}) : 'Bilinmiyor'}
            </div>
          </div>
        </div>
      </section>
      
            {/* Fragman Bölümü */}
            <section className="relative py-12 md:py-16 overflow-hidden">
              {/* Bulanık Arka Plan */}
              {anime.bannerImagePublicId && ( // Artık AnimeDataForTabs'ta var
                  <NextImage 
                      src={bannerUrl}
                      alt="" 
                      fill 
                      className="object-cover filter blur-xl scale-110 brightness-50 grayscale"
                      aria-hidden="true"
                  />
              )}
              <div className="absolute inset-0 bg-black/50"></div> {/* Ek karartma */}
              
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-6 [text-shadow:_1px_2px_2px_rgb(0_0_0_/_0.7)]">Fragman</h2>
                {/* <AnimeTrailerSection youtubeVideoId="YOUTUBE_VIDEO_ID" /> */}
                <div className="aspect-video max-w-3xl mx-auto bg-black rounded-lg shadow-2xl overflow-hidden">
                  {/* YouTube Embed (Örnek) */}
                  <iframe 
                      width="100%" 
                      height="100%" 
                      src="#" // Örnek video ID
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen>
                  </iframe>
                </div>
              </div>
            </section>

      <AnimeTabs 
        animeId={anime.id} 
        initialCommentCount={anime._count?.comments || 0} 
        animeData={anime} 
      />
    </div>
  );
}