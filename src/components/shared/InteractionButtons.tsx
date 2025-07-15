'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HeartIcon, HandThumbUpIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline, HandThumbUpIcon as HandThumbUpIconOutline } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { InteractionType } from '@prisma/client'; // Prisma enum'ını doğrudan kullanıyoruz

// --- YENİ VE GENELLEŞTİRİLMİŞ PROPS ARAYÜZÜ ---
export interface InteractionButtonsProps {
  // Artık spesifik bir 'projectId' değil, genel hedefler alıyoruz
  targetId: number;
  targetType: "PROJECT" | "TEAM" | "CONTENT" | "USER_DEMO" | "COMMENT" | "PACKAGE_VERSION";
  
  // Başlangıç değerleri
  initialLikeCount: number;
  initialFavoriteCount: number;
  
  // Kullanıcının bu hedefe karşı mevcut etkileşim durumu
  userInitialInteraction?: {
    liked: boolean;
    favorited: boolean;
  };

  isUserLoggedIn: boolean;

  // Stil için opsiyonel proplar
  buttonClassName?: string;
  iconSizeClassName?: string;
  textClassName?: string;
}

export default function InteractionButtons({
  targetId,
  targetType,
  initialLikeCount,
  initialFavoriteCount,
  userInitialInteraction,
  isUserLoggedIn,
  buttonClassName = "flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors",
  iconSizeClassName = "w-4 h-4",
  textClassName = "",
}: InteractionButtonsProps) {

  // State'lerimizi yeni prop isimlerine göre güncelliyoruz. Dislike kaldırıldı.
  const [liked, setLiked] = useState(userInitialInteraction?.liked || false);
  const [favorited, setFavorited] = useState(userInitialInteraction?.favorited || false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [isLoading, setIsLoading] = useState(false);

  // Proplar değiştiğinde state'i güncellemek için useEffect
  useEffect(() => {
    setLiked(userInitialInteraction?.liked || false);
    setFavorited(userInitialInteraction?.favorited || false);
    setLikeCount(initialLikeCount);
    setFavoriteCount(initialFavoriteCount);
  }, [userInitialInteraction, initialLikeCount, initialFavoriteCount]);


  // --- EN BÜYÜK DEĞİŞİKLİK: handleInteraction Fonksiyonu ---
  const handleInteraction = async (
    type: InteractionType, // Artık doğrudan Prisma'nın enum tipini kullanıyoruz
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

    // Yeni API endpoint'imiz
    const endpoint = '/api/interactions';
    
    // Etkileşim ekliyorsak POST, kaldırıyorsak DELETE metodu kullanacağız
    const method = currentState ? 'DELETE' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        // Body'ye artık tüm gerekli bilgileri gönderiyoruz
        body: JSON.stringify({
          targetId: targetId,
          targetType: targetType,
          type: type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Bir hata oluştu (${response.status})`);
      }
      
      // Başarı mesajını artık göstermeyebiliriz, daha akıcı bir deneyim için.
      // toast.success(data.message || 'İşlem başarılı!');

    } catch (error: any) {
      toast.error(error.message || 'İşlem sırasında bir hata oluştu.');
      rollbackCallback(); // Hata durumunda arayüzü eski haline getir
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = () => {
    const originalLiked = liked;
    const originalLikeCount = likeCount;

    handleInteraction(
      InteractionType.LIKE, // Enum kullanarak tip güvenliği sağlıyoruz
      originalLiked,
      () => { // Optimistic update
        setLiked(!originalLiked);
        setLikeCount(originalLiked ? likeCount - 1 : likeCount + 1);
      },
      () => { // Rollback
        setLiked(originalLiked);
        setLikeCount(originalLikeCount);
      }
    );
  };

  const handleFavorite = () => {
    const originalFavorited = favorited;
    const originalFavoriteCount = favoriteCount;

    handleInteraction(
      InteractionType.FAVORITE, // Enum kullanarak tip güvenliği sağlıyoruz
      originalFavorited,
      () => { // Optimistic update
        setFavorited(!originalFavorited);
        setFavoriteCount(originalFavorited ? favoriteCount - 1 : favoriteCount + 1);
      },
      () => { // Rollback
        setFavorited(originalFavorited);
        setFavoriteCount(originalFavoriteCount);
      }
    );
  };

  // --- RENDER KISMI: Dislike butonu kaldırıldı ---
  const disabledClass = "opacity-60 cursor-not-allowed";
  const activeLikeClass = "bg-dublio-500/80 text-white hover:bg-dublio-500";
  const activeFavoriteClass = "bg-red-500/80 text-white hover:bg-red-500";

  return (
    <div className="flex items-center space-x-3">
      {/* Beğen Butonu */}
      <button
        onClick={handleLike}
        disabled={isLoading || !isUserLoggedIn}
        title={!isUserLoggedIn ? "Beğenmek için giriş yapın" : (liked ? "Beğeniyi Geri Al" : "Beğen")}
        className={cn(buttonClassName, liked && activeLikeClass, (isLoading || !isUserLoggedIn) && disabledClass)}
      >
        {liked ? <HandThumbUpIcon className={iconSizeClassName} /> : <HandThumbUpIconOutline className={iconSizeClassName} />}
        <span className={textClassName}>{likeCount.toLocaleString('tr-TR')}</span>
      </button>

      {/* Favori Butonu */}
      <button
        onClick={handleFavorite}
        disabled={isLoading || !isUserLoggedIn}
        title={!isUserLoggedIn ? "Favorilere eklemek için giriş yapın" : (favorited ? "Favorilerden Çıkar" : "Favorilere Ekle")}
        className={cn(buttonClassName, favorited && activeFavoriteClass, (isLoading || !isUserLoggedIn) && disabledClass)}
      >
        {favorited ? <HeartIcon className={iconSizeClassName} /> : <HeartIconOutline className={iconSizeClassName} />}
        <span className={textClassName}>{favoriteCount.toLocaleString('tr-TR')}</span>
      </button>
    </div>
  );
}