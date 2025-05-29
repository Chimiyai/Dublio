// src/components/profile/OverviewContent.tsx
"use client"; 

import Link from "next/link";
import { useEffect, useState } from "react";
import FavoriteArtistCard from './FavoriteArtistCard'; // Favori sanatçı kartını import et

// API'den dönecek sanatçı tipi
interface FavoriteArtistApi {
  id: number;
  firstName: string;
  lastName: string;
  imagePublicId: string | null;
  bio?: string | null;
}

// API'den dönecek kategori istatistik tipi
interface UserCategoryStatApi {
  categoryName: string;
  categorySlug: string;
  projectCount: number;
  interactionScore: number;
  type: 'oyun' | 'anime';
}

// API'den dönecek genel istatistikler tipi
interface GeneralStatsApi {
  totalLikes: number;
  totalFavorites: number;
  totalComments?: number;
}

// OverviewContent'in API'den beklediği tüm veri yapısı
interface OverviewData {
  gameCategoryStats: UserCategoryStatApi[];
  animeCategoryStats: UserCategoryStatApi[];
  generalStats: GeneralStatsApi;
  favoriteArtists?: FavoriteArtistApi[]; // Favori sanatçılar opsiyonel
}

interface OverviewContentProps {
  user: {
    id: number;
    username: string;
  };
}

const formatBigNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const OverviewContent: React.FC<OverviewContentProps> = ({ user }) => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchOverviewStats = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, artistsRes] = await Promise.all([
        fetch(`/api/users/${user.id}/overview-stats`),
        fetch(`/api/users/${user.id}/favorite-artists?limit=4`) // Bu istek atılıyor mu?
      ]);

        if (!statsRes.ok) console.error("İstatistikler yüklenemedi:", await statsRes.text());
        // API'den gelen statsData'nın tipini Omit ile değil, doğrudan beklenen alt küme olarak alalım
        const statsDataPartial: { 
            gameCategoryStats: UserCategoryStatApi[];
            animeCategoryStats: UserCategoryStatApi[];
            generalStats: GeneralStatsApi;
        } = statsRes.ok ? await statsRes.json() : { gameCategoryStats: [], animeCategoryStats: [], generalStats: { totalLikes:0, totalFavorites:0 }};
        
        let favoriteArtistsData: FavoriteArtistApi[] = [];
      if (artistsRes.ok) {
        favoriteArtistsData = await artistsRes.json();
        console.log("OverviewContent - Fetched Favorite Artists:", favoriteArtistsData); // DEBUG
      } else {
        console.warn("Favori sanatçılar yüklenemedi:", await artistsRes.text());
      }

        setOverviewData({ 
            gameCategoryStats: statsDataPartial.gameCategoryStats,
            animeCategoryStats: statsDataPartial.animeCategoryStats,
            generalStats: statsDataPartial.generalStats,
            favoriteArtists: favoriteArtistsData 
        });

      } catch (err: any) {
        setError(err.message);
        console.error("OverviewContent fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverviewStats();
  }, [user?.id]);

  const renderCategoryStats = (stats: UserCategoryStatApi[]) => { // totalInteractionsForType parametresi kaldırıldı, içeride hesaplanacak
    if (!stats || stats.length === 0) {
      // Bu mesajı çağıran yerde özelleştirebiliriz.
      return null; 
    }

    const currentTypeTotalScore = stats.reduce((sum, stat) => sum + stat.interactionScore, 0);

    return (
      <div className="space-y-3">
        {stats.map((stat, index) => {
          const percentage = currentTypeTotalScore > 0 ? (stat.interactionScore / currentTypeTotalScore) * 100 : 0;
          return (
            // Key prop'u için index'i de ekleyerek benzersizliği garantileyelim
            <div key={`${stat.categorySlug}-${stat.type}-${index}`} className="category-stat-item">
              <div className="flex justify-between items-center text-sm mb-1">
                <Link 
                    href={`/${stat.type === 'oyun' ? 'oyunlar' : 'animeler'}/kategori/${stat.categorySlug}`} 
                    className="text-gray-200 hover:text-purple-400 transition-colors font-medium truncate pr-2"
                    title={stat.categoryName}>
                  {stat.categoryName}
                </Link>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {stat.projectCount} Proje / {formatBigNumber(stat.interactionScore)} Puan
                  </span>
                  <span className="text-purple-400 font-semibold text-sm whitespace-nowrap">
                    {percentage > 0 ? percentage.toFixed(0) + '%' : '-'}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-stat-gradient h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse"> {/* animate-pulse eklendi */}
        {[...Array(3)].map((_, i) => (
          <div key={`placeholder-stat-${i}`}>
            <div className="flex justify-between mb-1">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            </div>
            <div className="h-2.5 bg-gray-600 rounded-full w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !overviewData) {
    return <p className="text-center text-red-400 py-8">{error || "İstatistikler yüklenemedi."}</p>;
  }

  // overviewData null değilse güvenle erişebiliriz.
  const { gameCategoryStats, animeCategoryStats, generalStats, favoriteArtists } = overviewData;

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl lg:text-2xl font-semibold text-white mb-1">Genel Bakış</h2>
        <p className="text-sm text-gray-400">
          <span className="font-medium text-gray-200">{user.username}</span> kullanıcısının site içi tercihleri ve istatistikleri.
        </p>
      </div>

      <div className="bg-overview-table-bg p-4 sm:p-6 rounded-lg shadow-xl space-y-6 md:space-y-8">
        {/* Favori Oyun Türleri */}
        {gameCategoryStats && gameCategoryStats.length > 0 ? (
          <div>
            <h3 className="font-semibold text-lg text-gray-100 mb-3 pb-2 border-b border-gray-700">
              Favori Oyun Türleri
            </h3>
            {renderCategoryStats(gameCategoryStats)}
            <p className="mt-4 text-gray-300 text-xs sm:text-sm">
              <span className="font-semibold">{user.username}</span> genellikle <span className="text-purple-400">{gameCategoryStats.slice(0,2).map(s => s.categoryName).join(', ')}</span> gibi oyun türleriyle etkileşimde bulunuyor.
            </p>
          </div>
        ) : (
          !isLoading && <div><h3 className="font-semibold text-lg text-gray-100 mb-3">Favori Oyun Türleri</h3><p className="text-sm text-gray-400">Bu kullanıcı henüz oyun türleriyle etkileşimde bulunmamış.</p></div>
        )}

        {/* Favori Anime Türleri */}
        {animeCategoryStats && animeCategoryStats.length > 0 ? (
          <div>
            <h3 className="font-semibold text-lg text-gray-100 mb-3 pb-2 border-b border-gray-700">
              Favori Anime Türleri
            </h3>
            {renderCategoryStats(animeCategoryStats)}
            <p className="mt-4 text-gray-300 text-xs sm:text-sm">
              <span className="font-semibold">{user.username}</span> genellikle <span className="text-purple-400">{animeCategoryStats.slice(0,2).map(s => s.categoryName).join(', ')}</span> gibi anime türleriyle etkileşimde bulunuyor.
            </p>
          </div>
        ) : (
          !isLoading && <div><h3 className="font-semibold text-lg text-gray-100 mb-3">Favori Anime Türleri</h3><p className="text-sm text-gray-400">Bu kullanıcı henüz anime türleriyle etkileşimde bulunmamış.</p></div>
        )}
        
        {/* Eğer hem oyun hem de anime istatistiği yoksa genel bir mesaj */}
        {gameCategoryStats.length === 0 && animeCategoryStats.length === 0 && !isLoading && (
            <p className="text-center text-gray-400 py-6">Bu kullanıcı henüz kategorilerle yeterli etkileşimde bulunmamış.</p>
        )}

        {/* Genel Etkileşim */}
        {generalStats && (
            <div className="pt-4 border-t border-gray-700">
                <h3 className="font-semibold text-lg text-gray-100 mb-4">Genel Etkileşim</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-purple-400">{formatBigNumber(generalStats.totalLikes)}</p>
                        <p className="text-xs text-gray-400">Toplam Beğeni</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-purple-400">{formatBigNumber(generalStats.totalFavorites)}</p>
                        <p className="text-xs text-gray-400">Toplam Favori</p>
                    </div>
                    {generalStats.totalComments !== undefined && (
                        <div>
                            <p className="text-2xl font-bold text-purple-400">{formatBigNumber(generalStats.totalComments)}</p>
                            <p className="text-xs text-gray-400">Yaptığı Yorum</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Favori Seslendirme Sanatçıları - DOĞRU YERE TAŞINDI */}
        {favoriteArtists && favoriteArtists.length > 0 && (
            <div className="pt-4 border-t border-gray-700"> {/* Genel etkileşimden sonra ayrı bir bölüm */}
                <h3 className="font-semibold text-lg text-gray-100 mb-4">
                    Beğendiği Sanatçılar
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {favoriteArtists.map(artist => (
                    <FavoriteArtistCard key={artist.id} artist={artist} />
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default OverviewContent;