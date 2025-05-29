// src/components/project/ProjectInteractionButtons.tsx
'use client';

import { useState, useEffect } from 'react';
// import { useSession } from 'next-auth/react'; // isUserLoggedIn prop'u ile gelecek
import { toast } from 'react-hot-toast';
import { HeartIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';
import {
  HeartIcon as HeartIconOutline,
  HandThumbUpIcon as HandThumbUpIconOutline,
  HandThumbDownIcon as HandThumbDownIconOutline,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface ProjectInteractionButtonsProps {
  projectId: number;
  initialLikeCount: number;
  initialDislikeCount: number;
  initialFavoriteCount: number;
  userInitialInteraction?: {
    liked: boolean;
    disliked: boolean;
    favorited: boolean;
  };
  isUserLoggedIn: boolean;
  // pageCounterIds prop'una bu senaryoda ihtiyacımız olmayabilir,
  // çünkü butonlar zaten kendi içlerinde sayıları gösterecek.
  // Ama ileride gerekirse eklenebilir.
  buttonClassName?: string; // Ekstra stil için
  iconSizeClassName?: string; // İkon boyutu için
  textClassName?: string; // Sayıların metin stili için
}

export default function ProjectInteractionButtons({
  projectId,
  initialLikeCount,
  initialDislikeCount,
  initialFavoriteCount,
  userInitialInteraction,
  isUserLoggedIn,
  buttonClassName = "flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors",
  iconSizeClassName = "w-4 h-4",
  textClassName = "",
}: ProjectInteractionButtonsProps) {
  // const { data: session, status } = useSession(); // isUserLoggedIn prop'u ile geliyor
  // const isUserLoggedIn = status === 'authenticated'; // isUserLoggedIn prop'u ile geliyor

  const [liked, setLiked] = useState(userInitialInteraction?.liked || false);
  const [disliked, setDisliked] = useState(userInitialInteraction?.disliked || false);
  const [favorited, setFavorited] = useState(userInitialInteraction?.favorited || false);

  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLiked(userInitialInteraction?.liked || false);
    setDisliked(userInitialInteraction?.disliked || false);
    setFavorited(userInitialInteraction?.favorited || false);
    setLikeCount(initialLikeCount);
    setDislikeCount(initialDislikeCount);
    setFavoriteCount(initialFavoriteCount);
  }, [userInitialInteraction, initialLikeCount, initialDislikeCount, initialFavoriteCount]);

  const handleInteraction = async (
    type: 'like' | 'dislike' | 'favorite',
    currentState: boolean,
    optimisticCallback: () => void,
    rollbackCallback: () => void
  ) => {
    if (!isUserLoggedIn) {
      toast.error('Bu işlem için giriş yapmalısınız.');
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    optimisticCallback();

    const method = currentState ? 'DELETE' : 'POST';
    const endpoint = `/api/projects/${projectId}/${type}`;

    try {
      const response = await fetch(endpoint, { method });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Bir hata oluştu (${response.status})`);
      }

      toast.success(data.message || 'İşlem başarılı!');

      if (data.likeCount !== undefined) setLikeCount(data.likeCount);
      if (data.dislikeCount !== undefined) setDislikeCount(data.dislikeCount);
      if (data.favoriteCount !== undefined) setFavoriteCount(data.favoriteCount);

    } catch (error: any) {
      toast.error(error.message || 'İşlem sırasında bir hata oluştu.');
      rollbackCallback();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = () => {
    const originalLiked = liked;
    const originalDisliked = disliked;
    const originalLikeCount = likeCount;
    const originalDislikeCount = dislikeCount;

    handleInteraction(
      'like',
      originalLiked,
      () => {
        setLiked(!originalLiked);
        setLikeCount(originalLiked ? likeCount - 1 : likeCount + 1);
        if (!originalLiked && originalDisliked) {
          setDisliked(false);
          setDislikeCount(dislikeCount - 1);
        }
      },
      () => {
        setLiked(originalLiked);
        setDisliked(originalDisliked);
        setLikeCount(originalLikeCount);
        setDislikeCount(originalDislikeCount);
      }
    );
  };

  const handleDislike = () => {
    const originalLiked = liked;
    const originalDisliked = disliked;
    const originalLikeCount = likeCount;
    const originalDislikeCount = dislikeCount;

    handleInteraction(
      'dislike',
      originalDisliked,
      () => {
        setDisliked(!originalDisliked);
        setDislikeCount(originalDisliked ? dislikeCount - 1 : dislikeCount + 1);
        if (!originalDisliked && originalLiked) {
          setLiked(false);
          setLikeCount(likeCount - 1);
        }
      },
      () => {
        setLiked(originalLiked);
        setDisliked(originalDisliked);
        setLikeCount(originalLikeCount);
        setDislikeCount(originalDislikeCount);
      }
    );
  };

  const handleFavorite = () => {
    const originalFavorited = favorited;
    const originalFavoriteCount = favoriteCount;

    handleInteraction(
      'favorite',
      originalFavorited,
      () => {
        setFavorited(!originalFavorited);
        setFavoriteCount(originalFavorited ? favoriteCount - 1 : favoriteCount + 1);
      },
      () => {
        setFavorited(originalFavorited);
        setFavoriteCount(originalFavoriteCount);
      }
    );
  };

  const disabledClass = "opacity-60 cursor-not-allowed";
  const activeLikeClass = "bg-prestij-600 hover:bg-prestij-700"; // Aktif like için özel stil
  const activeDislikeClass = "bg-red-600 hover:bg-red-700"; // Aktif dislike için özel stil
  const activeFavoriteClass = "bg-yellow-500 hover:bg-yellow-600"; // Aktif favori için özel stil

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleLike}
        disabled={isLoading || !isUserLoggedIn}
        title={!isUserLoggedIn ? "Beğenmek için giriş yapın" : (liked ? "Beğeniyi Geri Al" : "Beğen")}
        className={cn(
          buttonClassName,
          liked && activeLikeClass, // Eğer liked ise aktif class'ı uygula
          (isLoading || !isUserLoggedIn) && disabledClass
        )}
      >
        {liked ? <HandThumbUpIcon className={iconSizeClassName} /> : <HandThumbUpIconOutline className={iconSizeClassName} />}
        <span className={textClassName}>{likeCount.toLocaleString('tr-TR')}</span>
      </button>

      <button
        onClick={handleDislike}
        disabled={isLoading || !isUserLoggedIn}
        title={!isUserLoggedIn ? "Beğenmemek için giriş yapın" : (disliked ? "Beğenmemeyi Geri Al" : "Beğenme")}
        className={cn(
          buttonClassName,
          disliked && activeDislikeClass, // Eğer disliked ise aktif class'ı uygula
          (isLoading || !isUserLoggedIn) && disabledClass
        )}
      >
        {disliked ? <HandThumbDownIcon className={iconSizeClassName} /> : <HandThumbDownIconOutline className={iconSizeClassName} />}
        <span className={textClassName}>{dislikeCount.toLocaleString('tr-TR')}</span>
      </button>

      <button
        onClick={handleFavorite}
        disabled={isLoading || !isUserLoggedIn}
        title={!isUserLoggedIn ? "Favorilere eklemek için giriş yapın" : (favorited ? "Favorilerden Çıkar" : "Favorilere Ekle")}
        className={cn(
          buttonClassName,
          favorited && activeFavoriteClass, // Eğer favorited ise aktif class'ı uygula
          (isLoading || !isUserLoggedIn) && disabledClass
        )}
      >
        {favorited ? <HeartIcon className={iconSizeClassName} /> : <HeartIconOutline className={iconSizeClassName} />}
        <span className={textClassName}>{favoriteCount.toLocaleString('tr-TR')}</span>
      </button>
    </div>
  );
}