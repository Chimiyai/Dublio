// src/app/oyunlar/[slug]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import NextImage from 'next/image'; // Image'ı 'NextImage' olarak import etmiştik, bu şekilde kullanalım
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { StarIcon, PhotoIcon as PagePhotoIcon } from '@heroicons/react/24/solid';

import GameTabs, { GameDataForTabs, CategoryForGamePage } from '@/components/game/GameTabs'; // Gerekli tipleri de import et
// YENİ: ProjectInteractionButtons importu
import ProjectInteractionButtons, { ProjectInteractionButtonsProps } from '@/components/project/ProjectInteractionButtons';

interface GameDetailPageProps {
  params: {
    slug: string;
  };
}

async function getGameDetails(slug: string): Promise<GameDataForTabs | null> { // Dönüş tipini GameDataForTabs yap
  const project = await prisma.project.findUnique({
    where: { slug: decodeURIComponent(slug), type: 'oyun' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      bannerImagePublicId: true,
      coverImagePublicId: true,
      releaseDate: true,
      price: true,
      currency: true,
      likeCount: true,
      dislikeCount: true,
      favoriteCount: true,
      _count: { select: { comments: true } },
      categories: {
        select: {
            category: { select: { name: true, slug: true }}
        }
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
    }
  });

  if (!project) return null;

  // Prisma'dan dönen tipi GameDataForTabs'a cast etmeden önce uyumlu olduğundan emin olmalıyız.
  // Manuel mapping ile tip güvenliğini sağlayalım.
  const gameData: GameDataForTabs = {
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    bannerImagePublicId: project.bannerImagePublicId,
    coverImagePublicId: project.coverImagePublicId,
    releaseDate: project.releaseDate,
    price: project.price,
    currency: project.currency,
    likeCount: project.likeCount,
    dislikeCount: project.dislikeCount,
    favoriteCount: project.favoriteCount,
    categories: project.categories as CategoryForGamePage[], // Cast
    assignments: project.assignments.map(a => ({
        id: a.id,
        role: a.role,
        artist: a.artist, // Bu zaten ArtistForCard tipine uygun olmalı
        voiceRoles: a.voiceRoles.map(vr => ({
            character: vr.character, // Bu zaten CharacterInfoForCard tipine uygun olmalı
        }))
    })),
    _count: project._count,
  };
  return gameData;
}

export async function generateMetadata({ params }: GameDetailPageProps) {
  const pageSlug = params.slug;
  const game = await getGameDetails(pageSlug); // Artık GameDataForTabs | null döner
  if (!game) return { title: 'Oyun Bulunamadı' };
  return {
    title: `${game.title} | PrestiJ Studio`,
    description: game.description?.substring(0, 160) || `PrestiJ Studio tarafından Türkçe dublajlı ${game.title} oyunu.`,
  };
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const pageSlug = params.slug;
  const session = await getServerSession(authOptions);
  
  const game = await getGameDetails(pageSlug); // game artık GameDataForTabs | null

  if (!game) {
    notFound();
  }
  
  let userHasGame = false;
  // YENİ: Kullanıcının bu projeyle etkileşimleri
  let userInitialGameInteraction: ProjectInteractionButtonsProps['userInitialInteraction'] = {
    liked: false,
    disliked: false,
    favorited: false,
  };

  if (session?.user?.id) {
    const userId = parseInt(session.user.id);
    userHasGame = !!await prisma.userOwnedGame.findUnique({
      where: { userId_projectId: { userId, projectId: game.id } }
    });

    const [likedEntry, dislikedEntry, favoritedEntry] = await Promise.all([
      prisma.projectLike.findUnique({ where: { userId_projectId: { userId, projectId: game.id } } }),
      prisma.projectDislike.findUnique({ where: { userId_projectId: { userId, projectId: game.id } } }),
      prisma.projectFavorite.findUnique({ where: { userId_projectId: { userId, projectId: game.id } } }),
    ]);
    userInitialGameInteraction = {
      liked: !!likedEntry,
      disliked: !!dislikedEntry,
      favorited: !!favoritedEntry,
    };
  }

  const bannerUrl = getCloudinaryImageUrlOptimized(
    game.bannerImagePublicId, // Artık GameDataForTabs'ta var
    { width: 1920, height: 700, crop: 'fill', gravity: 'auto' },
    'banner'
  );
  const coverUrl = getCloudinaryImageUrlOptimized(
    game.coverImagePublicId, // Artık GameDataForTabs'ta var
    { width: 200, height: 280, crop: 'fill' },
    'cover'
  );

  const totalVotes = (game.likeCount || 0) + (game.dislikeCount || 0); // Artık GameDataForTabs'ta var
  const likePercentage = totalVotes > 0 ? Math.round(((game.likeCount || 0) / totalVotes) * 100) : 0; // Artık GameDataForTabs'ta var

  const seriesGames: any[] = []; // Bu kısmı daha sonra doldurabiliriz

  return (
    <div className="bg-[#101014] min-h-screen text-gray-300">
      <section className="relative w-full h-[70vh] sm:h-[80vh] md:h-[85vh] overflow-hidden">
        {game.bannerImagePublicId ? ( // Artık GameDataForTabs'ta var
          <NextImage src={bannerUrl} alt={`${game.title} Banner`} fill className="object-cover object-center" priority sizes="100vw" />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center"><PagePhotoIcon className="w-24 h-24 text-gray-500"/></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-[1]"></div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#101014] via-[#101014]/80 to-transparent z-[2]"></div>

        <div className="absolute inset-0 container mx-auto px-4 sm:px-6 lg:px-8 flex items-center z-[3]">
          <div className="w-full md:w-1/2 lg:w-2/5 xl:w-1/3">
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl shadow-2xl">
              <div className="relative w-32 h-44 sm:w-36 sm:h-52 float-left mr-4 mb-2 sm:mb-0 rounded-md overflow-hidden shadow-lg border-2 border-white/10">
                {game.coverImagePublicId ? ( // Artık GameDataForTabs'ta var
                  <NextImage src={coverUrl} alt={`${game.title} Kapağı`} fill className="object-cover" sizes="200px" />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center"><PagePhotoIcon className="w-12 h-12 text-gray-400"/></div>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 [text-shadow:_1px_2px_3px_rgb(0_0_0_/_0.5)]">
                {game.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 line-clamp-3 sm:line-clamp-4 mb-4 leading-relaxed">
                {game.description || "Açıklama yakında eklenecek."}
              </p>
              
              {/* Etkileşim Butonları (YENİ) */}
              <div className="mb-4">
                <ProjectInteractionButtons
                    projectId={game.id}
                    initialLikeCount={game.likeCount} // Artık GameDataForTabs'ta var
                    initialDislikeCount={game.dislikeCount} // Artık GameDataForTabs'ta var
                    initialFavoriteCount={game.favoriteCount} // Artık GameDataForTabs'ta var
                    userInitialInteraction={userInitialGameInteraction} // Tanımlandı
                    isUserLoggedIn={!!session?.user?.id}
                />
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 right-4 sm:right-6 lg:right-8 z-[3] text-right space-y-3">
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
                {userHasGame ? (
                    <span className="bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-lg">
                        Kütüphanede
                    </span>
                ) : game.price !== null && game.price > 0 ? (
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                        {game.price.toFixed(2)} {game.currency || 'TRY'} - Satın Al 
                    </button>
                ) : (
                    <span className="bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-lg">
                        Ücretsiz (Kur)
                    </span>
                )}
            </div>
             <div className="text-xs text-gray-300 [text-shadow:_0_1px_1px_rgb(0_0_0_/_0.5)]">
  Tür: {game.categories.map((c: { category: { name: string; slug: string } }) => c.category.name).join(', ') || 'Belirtilmemiş'} | Yayın: {game.releaseDate ? format(new Date(game.releaseDate), 'dd MMM yyyy', {locale: tr}) : 'Bilinmiyor'}
</div>
          </div>
        </div>
      </section>

      {/* Serinin Diğer Oyunları (Opsiyonel) */}
      {seriesGames && seriesGames.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold text-white">Serinin Diğer Oyunları</h2>
            {/* Aç/Kapa butonu eklenebilir */}
          </div>
          {/* <SeriesGamesSection games={seriesGames} /> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Örnek Kart (PopularContentCard benzeri) */}
            {seriesGames.map(s_game => (<div key={s_game.slug} className="bg-gray-800 p-3 rounded-lg">...{s_game.title}...</div>))}
          </div>
        </section>
      )}

      {/* Fragman Bölümü */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        {/* Bulanık Arka Plan */}
        {game.bannerImagePublicId && ( // Artık GameDataForTabs'ta var
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
          {/* <GameTrailerSection youtubeVideoId="YOUTUBE_VIDEO_ID" /> */}
          <div className="aspect-video max-w-3xl mx-auto bg-black rounded-lg shadow-2xl overflow-hidden">
            {/* YouTube Embed (Örnek) */}
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Örnek video ID
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen>
            </iframe>
          </div>
        </div>
      </section>

      <GameTabs 
        gameId={game.id} 
        initialCommentCount={game._count?.comments || 0} 
        gameData={game} // game objesi doğrudan GameDataForTabs tipine uygun olmalı
    />
    </div>
  );
}