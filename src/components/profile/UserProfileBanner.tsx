// src/components/profile/UserProfileBanner.tsx
"use client";

import Image from 'next/image';
import { PhotoIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, Fragment } from 'react'; // Fragment eklendi
import { Dialog, Transition } from '@headlessui/react'; // Dialog ve Transition import edildi
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils'; // cn fonksiyonunu import edelim

interface UserProfileBannerProps {
  bannerUrl: string;
  username: string;
  isOwnProfile: boolean;
  profileId: number;
}

const UserProfileBanner: React.FC<UserProfileBannerProps> = ({
  bannerUrl,
  username,
  isOwnProfile,
  profileId,
}) => {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  // --- YENİ MODAL STATE'LERİ ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false); // Engelli mi?
  
  const fetchBlockStatus = async () => {
    try {
      const res = await fetch(`/api/users/${profileId}/block-status`);
      const data = await res.json();
      setIsBlocked(!!data.isBlocked);
    } catch {
      setIsBlocked(false);
    }
  };

  // --- ENGEL DURUMUNU BACKEND'DEN ÇEK ---
  useEffect(() => {
    if (!isOwnProfile && profileId) {
      fetchBlockStatus();
    }
  }, [profileId, isOwnProfile]);
  
  // Raporlama modalını açan fonksiyon
  const openReportModal = () => {
    setIsOptionsMenuOpen(false); // Önceki menüyü kapat
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    // Formu temizle
    setTimeout(() => {
        setReportReason('');
        setReportDescription('');
    }, 300); // Kapanış animasyonu sonrası
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) {
      toast.error('Lütfen bir rapor sebebi seçin.');
      return;
    }
    
    setIsSubmittingReport(true);
    const toastId = toast.loading('Rapor gönderiliyor...');
    try {
      const response = await fetch(`/api/users/${profileId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: reportReason, 
          description: reportDescription.trim() === '' ? null : reportDescription // Boşsa null gönder
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(data.message, { id: toastId });
      closeReportModal(); // Başarılı olunca modalı kapat
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleBlock = async () => {
    const toastId = toast.loading(isBlocked ? "Engel kaldırılıyor..." : "Kullanıcı engelleniyor...");
    try {
      // ARTIK BODY GÖNDERMİYORUZ. API KENDİSİ KARAR VERECEK.
      const response = await fetch(`/api/users/${profileId}/block`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(data.message, { id: toastId });
      setIsOptionsMenuOpen(false);
      // Engel durumunu anında güncellemek için state'i tersine çevirebiliriz.
      // Veya sunucudan taze veri çekebiliriz. İkisi de olur.
      setIsBlocked(!isBlocked); // Optimistic UI update
      // fetchBlockStatus(); // Veya sunucudan tekrar çekerek %100 doğrulama
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    }
};

  const reportReasons = ["Spam veya Alakasız İçerik", "Taciz veya Zorbalık", "Uygunsuz Profil Bilgileri (İsim, Resim, Bio)", "Taklitçilik", "Diğer"];

  return (
    <div className="banner-container w-full h-[60vh] sm:h-[65vh] md:h-[70vh] bg-gray-800 relative">
      {bannerUrl && !bannerUrl.endsWith('placeholder-banner.jpg') ? ( // Placeholder değilse göster
        <Image
          src={bannerUrl}
          alt={`${username} banner resmi`}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-800/40 via-indigo-800/40 to-pink-800/40 flex items-center justify-center">
          <PhotoIcon className="w-24 h-24 text-gray-500/60" />
        </div>
      )}
      {/* Alttan yukarı doğru solan gradyan (z-index'i ayarlanacak) */}
      <div 
        className="absolute inset-x-0 bottom-0 h-3/4 sm:h-2/3 md:h-3/5 z-[5] pointer-events-none" // z-index eklendi
        style={{
          background: 'linear-gradient(to top, rgba(16, 16, 20, 1) 0%, rgba(16, 16, 20, 0.8) 25%, transparent 100%)'
        }}
      />

      {/* Sağ Üst: Raporlama Menüsü (Sadece başkasının profilindeyken) */}
      {!isOwnProfile && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <div className="relative">
            <button
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors"
              aria-label="Daha fazla seçenek"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOptionsMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20">
                <button
                  onClick={openReportModal} // YENİ FONKSİYON
                  className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  Kullanıcıyı Raporla
                </button>
                <button
                  onClick={handleBlock}
                  className="block w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-700/50 hover:text-white"
                >
                  {isBlocked ? "Engeli Kaldır" : "Kullanıcıyı Engelle"}
                </button>
                {/* Başka seçenekler eklenebilir */}
              </div>
            )}
          </div>
        </div>
      )}

      <Transition appear show={isReportModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeReportModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 border border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white">
                    "{username}" Kullanıcısını Raporla
                  </Dialog.Title>
                  <form onSubmit={handleReportSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="reportReason" className="block text-sm font-medium text-gray-300">Rapor Sebebi</label>
                      <select
                        id="reportReason"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="" disabled>Bir sebep seçin...</option>
                        {reportReasons.map(reason => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reportDescription" className="block text-sm font-medium text-gray-300">
                        Detaylar (Opsiyonel)
                      </label>
                      <textarea
                        id="reportDescription"
                        rows={4}
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Lütfen durumu detaylandırın..."
                        className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="mt-6 flex justify-end gap-4">
                      <button type="button" onClick={closeReportModal} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">
                        İptal
                      </button>
                      <button type="submit" disabled={isSubmittingReport || !reportReason} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-wait">
                        {isSubmittingReport ? 'Gönderiliyor...' : 'Raporu Gönder'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default UserProfileBanner;