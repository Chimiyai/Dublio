// src/components/projects/ProjectDetailContent.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectDataForDetail, UserInteractionData } from '@/app/projeler/[slug]/page';
import ProjectDetailCover from '@/components/ProjectDetailCover';
import ProjectTabs from '@/components/projects/ProjectTabs';
import ProjectInteractionButtons from '@/components/project/ProjectInteractionButtons';
import NextImage from 'next/image';
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { StarIcon, PhotoIcon as PagePhotoIcon, PlayCircleIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ProjectDetailContentProps {
  project: ProjectDataForDetail;
  isUserLoggedIn: boolean;
  userHasGame: boolean;
  userInitialInteraction: UserInteractionData;
}

export default function ProjectDetailContent({
  project,
  isUserLoggedIn,
  userHasGame,
  userInitialInteraction,
}: ProjectDetailContentProps) {
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const router = useRouter();
  const [playTrailerTrigger, setPlayTrailerTrigger] = useState(false);
  const [isVideoActuallyPlaying, setIsVideoActuallyPlaying] = useState(false);

  const handleTrailerToggle = () => {
    // ... (bu fonksiyon aynı kalabilir)
    if (isVideoActuallyPlaying) {
      setPlayTrailerTrigger(false);
      setIsVideoActuallyPlaying(false);
    } else {
      setPlayTrailerTrigger(true);
    }
  };

  const handleVideoStateChangeFromCover = (isPlaying: boolean, hasError?: boolean) => {
    // ... (bu fonksiyon aynı kalabilir)
    setIsVideoActuallyPlaying(isPlaying);
    if (!isPlaying || hasError) {
      setPlayTrailerTrigger(false);
    }
  };

  const coverUrl = getCloudinaryImageUrlOptimized(
    project.coverImagePublicId,
    { width: 200, height: 280, crop: 'fill', gravity: 'face' },
    'cover'
  );

  // --- YENİ SATIN ALMA HANDLER FONKSİYONU ---
  const handlePurchase = async () => {
    if (!isUserLoggedIn) {
      toast.error("Satın almak için giriş yapmalısınız.");
      router.push('/giris'); // Giriş yapmaya yönlendir
      return;
    }
    
    setIsRedirectingToPayment(true);
    toast.loading('Ödeme sayfasına yönlendiriliyorsunuz...');

    try {
      // YENİ API ROTASINI ÇAĞIR
      const response = await fetch('/api/payment/shopier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });

      const sessionData = await response.json();
      toast.dismiss(); // Yükleniyor toast'ını kapat

      if (!response.ok) {
        throw new Error(sessionData.message || 'Ödeme oturumu oluşturulamadı.');
      }

      if (sessionData.paymentHTML) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(sessionData.paymentHTML);
          newWindow.document.close();
        } else {
          throw new Error('Tarayıcı yeni pencere açmayı engelledi. Lütfen popup engelleyiciyi devre dışı bırakın.');
        }
      } else {
        throw new Error('Ödeme formu alınamadı.');
      }

    } catch (error) {
      toast.dismiss();
      toast.error((error as Error).message);
      setIsRedirectingToPayment(false);
    }
  };
  
  // ... (totalVotes ve likePercentage hesaplamaları aynı)
  const totalVotes = (project.likeCount || 0) + (project.dislikeCount || 0);
  const likePercentage = totalVotes > 0 ? Math.round(((project.likeCount || 0) / totalVotes) * 100) : 0;

  // --- YENİ: Butonları render etmek için bir yardımcı fonksiyon ---
  const renderProjectActionButtons = () => {
    // --- 1. SENARYO: ANİME ---
    if (project.type === 'anime') {
      if (project.externalWatchUrl) {
        return (
          <Link href={project.externalWatchUrl} target="_blank" rel="noopener noreferrer"
              className="order-2 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              <PlayCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" /> Hemen İzle
          </Link>
        );
      }
      return (
          <span className="order-2 inline-block bg-gray-700 text-gray-300 px-5 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg cursor-not-allowed">
              İzleme Linki Yok
          </span>
      );
    }

    // --- 2. SENARYO: OYUN ---
    if (project.type === 'oyun') {
      const isPaidGame = typeof project.price === 'number' && project.price > 0;
      const downloadUrl = project.externalWatchUrl;

      if (isPaidGame) {
        if (userHasGame) {
          if (downloadUrl) {
            return (
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
                 className="order-2 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                İndir
              </a>
            );
          }
          // Sahip ama indirme linki yok
          return (
            <span className="order-2 bg-green-600 text-white px-5 py-3 rounded-lg text-sm font-semibold shadow-lg">
              Kütüphanede
            </span>
          );
        } else {
          return (
            <button 
              onClick={handlePurchase}
              disabled={isRedirectingToPayment}
              className="order-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-wait"
            >
              {isRedirectingToPayment 
                ? 'Lütfen Bekleyin...' 
                : `${project.price!.toFixed(2)} ${project.currency || 'TRY'} - Satın Al`
              }
            </button>
          );
        }
      } 
      
      // 2b. Ücretsiz Oyun (price 0 veya null)
      else {
        if (downloadUrl) {
          return (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
               className="order-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
              Ücretsiz İndir
            </a>
          );
        }
        // Ücretsiz ama indirme linki yok
        return (
          <span className="order-2 inline-block bg-gray-700 text-gray-300 px-5 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg cursor-not-allowed">
              Link Bekleniyor
          </span>
        );
      }
    }

    // Proje tipi oyun veya anime değilse (beklenmedik durum)
    return null;
  };

  return (
    <div className="bg-[#101014] min-h-screen text-gray-300">
      {/* 1. SECTION: Banner/Video Alanı */}
      <section 
        className={cn(
          "relative w-full bg-black rounded-lg shadow-lg overflow-hidden",
          "h-[56.25vw] max-h-[80vh] min-h-[300px] md:min-h-[400px]",
          "z-10"
        )}
      >
        <ProjectDetailCover
          project={{
            title: project.title,
            bannerImagePublicId: project.bannerImagePublicId,
            trailerUrl: project.trailerUrl
          }}
          playTrigger={playTrailerTrigger}
          onVideoStateChange={handleVideoStateChangeFromCover}
        />
      </section>

      {/* 2. SECTION: Kapak, başlık, butonlar vb. */}
      <section className={cn("relative z-20 -mt-24 sm:-mt-32 md:-mt-40 lg:-mt-48")}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-end md:items-center gap-6">
          {/* Sol Taraf */}
          <div className="w-full md:w-2/3 lg:w-3/4 xl:w-3/5">
            <div className="bg-black/60 dark:bg-[#151519]/80 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                <div className="relative w-32 h-44 sm:w-36 sm:h-52 md:w-40 md:h-[220px] flex-shrink-0 rounded-md overflow-hidden shadow-lg border-2 border-white/10">
                    {project.coverImagePublicId ? (
                        <NextImage src={coverUrl} alt={`${project.title} Kapağı`} fill className="object-cover" sizes="(max-width: 640px) 128px, 160px" priority />
                    ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center"><PagePhotoIcon className="w-12 h-12 text-gray-400"/></div>
                    )}
                </div>
                <div className="flex-grow text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 [text-shadow:_1px_2px_3px_rgb(0_0_0_/_0.6)]">
                        {project.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 leading-relaxed">
                        {project.description?.substring(0,150) || "Açıklama mevcut değil."}{project.description && project.description.length > 150 ? "..." : ""}
                    </p>
                    <ProjectInteractionButtons
                        projectId={project.id}
                        isUserLoggedIn={isUserLoggedIn}
                        initialLikeCount={project.likeCount} // Bu prop'ları geçirin
                        initialDislikeCount={project.dislikeCount} // Bu prop'ları geçirin
                        initialFavoriteCount={project.favoriteCount} // Bu prop'ları geçirin
                        userInitialInteraction={userInitialInteraction}
                    />
                </div>
              </div>
            </div>
          </div>
          {/* Sağ Taraf */}
          <div className="w-full md:w-1/3 lg:w-1/2 xl:w-2/5 flex-grow flex flex-col items-center md:items-end text-center md:text-right space-y-3 pb-4 md:pb-0">
          {project.averageRating && project.averageRating > 0 && project._count.ratings && project._count.ratings > 0 ? (
    <div className="bg-black/40 backdrop-blur-sm p-2 rounded-md inline-block">
        <div className="flex items-center gap-1">
            <StarIcon className="w-4 h-4 text-yellow-400 drop-shadow" />
            <span className="text-sm text-white font-semibold [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.8)]">{project.averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.8)]">({project._count.ratings} oy)</span>
        </div>
    </div>
) : totalVotes > 3 ? (
    <div className="bg-black/40 backdrop-blur-sm p-2 rounded-md inline-block">
        <div className="flex items-center gap-1" title={`${likePercentage}% Beğeni Oranı`}>
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-4 h-4 ${i * 20 < likePercentage ? 'text-yellow-400' : 'text-gray-600'} drop-shadow`} />
            ))}
            <span className="text-xs text-white ml-1 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.8)]">({totalVotes} oy)</span>
        </div>
    </div>
) : (
    <div className="bg-black/40 backdrop-blur-sm p-2 rounded-md inline-block">
        <div className="flex items-center gap-1">
            <StarIcon className="w-4 h-4 text-gray-600 drop-shadow" />
            <span className="text-xs text-gray-400 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.8)]">Yeterli Oylama Yok</span>
        </div>
    </div>
)}
             {/* Buton Grubu */}
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-3 gap-y-2">
              {/* ANA EYLEM BUTONLARI (render fonksiyonunu çağırıyoruz) */}
              {renderProjectActionButtons()}

            </div>
            <div className="text-xs text-gray-300 [text-shadow:_0_2px_2px_rgb(0_0_0_/_0.8)]">
    Tür: {project.categories.map(c => c.category.name).join(', ') || 'Belirtilmemiş'} | Yayın: {project.releaseDate ? format(new Date(project.releaseDate), 'dd MMM yyyy', {locale: tr}) : 'Bilinmiyor'}
</div>
          </div>
        </div>
      </section>

      {/* Açıklama Bölümü */}
      {project.description && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">Proje Açıklaması</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-line leading-relaxed">{project.description}</p>
            </div>
          </div>
        </section>
      )}

      {/* 3. SECTION: ProjectTabs */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <ProjectTabs project={project} />
      </section>
    </div>
  );
}