// src/components/artists/ArtistInteractionButtons.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { HeartIcon as SolidHeartIcon, HandThumbUpIcon as SolidThumbUpIcon } from '@heroicons/react/24/solid';
import { HeartIcon as OutlineHeartIcon, HandThumbUpIcon as OutlineThumbUpIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ArtistInteractionButtonsProps {
  artistId: number;
  initialLikeCount: number;
  initialFavoriteCount: number;
  initialUserLiked: boolean;
  initialUserFavorited: boolean;
}

export default function ArtistInteractionButtons({
  artistId,
  initialLikeCount,
  initialFavoriteCount,
  initialUserLiked,
  initialUserFavorited,
}: ArtistInteractionButtonsProps) {
  const { data: session, status } = useSession();
  const isUserLoggedIn = status === 'authenticated';

  const [liked, setLiked] = useState(initialUserLiked);
  const [favorited, setFavorited] = useState(initialUserFavorited);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLiked(initialUserLiked);
    setFavorited(initialUserFavorited);
    setLikeCount(initialLikeCount);
    setFavoriteCount(initialFavoriteCount);
  }, [initialUserLiked, initialUserFavorited, initialLikeCount, initialFavoriteCount]);

  const handleInteraction = async (
    type: 'like' | 'favorite',
    currentStateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    countSetter: React.Dispatch<React.SetStateAction<number>>,
    currentOptimisticState: boolean
  ) => {
    if (!isUserLoggedIn) {
      toast.error('Bu işlem için giriş yapmalısınız.');
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    // Optimistic update
    currentStateSetter(!currentOptimisticState);
    countSetter(prev => currentOptimisticState ? prev - 1 : prev + 1);

    try {
      const response = await fetch(`/api/artists/${artistId}/${type}`, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        // Rollback optimistic update
        currentStateSetter(currentOptimisticState);
        countSetter(prev => currentOptimisticState ? prev + 1 : prev - 1); // Dikkat: decrement/increment tersi
        throw new Error(data.message || 'İşlem başarısız oldu.');
      }

      toast.success(data.message);
      // API'den gelen güncel sayılarla state'i senkronize et
      if (type === 'like' && data.likeCount !== undefined) countSetter(data.likeCount);
      if (type === 'favorite' && data.favoriteCount !== undefined) countSetter(data.favoriteCount);
      // API'den gelen userLiked/userFavorited durumuyla da senkronize et
      if (type === 'like' && data.userLiked !== undefined) currentStateSetter(data.userLiked);
      if (type === 'favorite' && data.userFavorited !== undefined) currentStateSetter(data.userFavorited);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 mt-3">
      <button
        onClick={() => handleInteraction('like', setLiked, setLikeCount, liked)}
        disabled={isLoading || !isUserLoggedIn}
        title={!isUserLoggedIn ? "Beğenmek için giriş yapın" : (liked ? "Beğeniyi Geri Al" : "Beğen")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors",
          liked 
            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
            : "bg-prestij-input-bg/70 text-prestij-text-secondary hover:bg-prestij-input-bg",
          (isLoading || !isUserLoggedIn) && "opacity-60 cursor-not-allowed"
        )}
      >
        {liked ? <SolidThumbUpIcon className="w-4 h-4" /> : <OutlineThumbUpIcon className="w-4 h-4" />}
        <span>{likeCount.toLocaleString('tr-TR')}</span>
      </button>

      <button
        onClick={() => handleInteraction('favorite', setFavorited, setFavoriteCount, favorited)}
        disabled={isLoading || !isUserLoggedIn}
        title={!isUserLoggedIn ? "Favorilere eklemek için giriş yapın" : (favorited ? "Favorilerden Çıkar" : "Favorilere Ekle")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors",
          favorited 
            ? "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30" 
            : "bg-prestij-input-bg/70 text-prestij-text-secondary hover:bg-prestij-input-bg",
          (isLoading || !isUserLoggedIn) && "opacity-60 cursor-not-allowed"
        )}
      >
        {favorited ? <SolidHeartIcon className="w-4 h-4" /> : <OutlineHeartIcon className="w-4 h-4" />}
        <span>{favoriteCount.toLocaleString('tr-TR')}</span>
      </button>
    </div>
  );
}