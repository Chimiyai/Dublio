// src/components/layout/SearchOverlay.tsx (Yeni dosya)
"use client";

import { XMarkIcon } from '@heroicons/react/24/solid'; // Kapatma ikonu için
import React, { useState, useEffect, useRef, Fragment } from 'react'; // Fragment eklendi
import { Transition } from '@headlessui/react'; // Transition import edildi
import PopularContentCard from '@/components/ui/PopularContentCard'; // Sonuç kartı için
import { ApiProjectPopular } from '@/types/showcase'; // API'den gelecek veri tipi
import PopularContentCardPlaceholder from '@/components/ui/PopularContentCardPlaceholder';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ 
  isOpen, 
  onClose, 
  // initialSearchTerm = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState(''); // initialSearchTerm ? initialSearchTerm : ''
  const [results, setResults] = useState<ApiProjectPopular[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // İlk yükleme mi?

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchContent = async (currentSearchTerm: string) => {
    setIsLoading(true);
    setError(null);
    let apiUrl = '/api/projects?';
    const params = new URLSearchParams();

    if (currentSearchTerm.trim() !== '') {
      params.append('title_contains', currentSearchTerm.trim()); // Arama terimi varsa
      params.append('limit', '12'); // Arama sonuçları için limit
    } else {
      // Arama terimi yoksa (overlay ilk açıldığında), popüler veya en son içerikleri getir
      params.append('sortBy', 'popular'); // VEYA 'newest'
      params.append('limit', '9'); // Başlangıçta gösterilecek popüler/yeni içerik sayısı (3x3 grid için)
    }
    
    apiUrl += params.toString();
    // console.log("SearchOverlay fetching from:", apiUrl);

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('İçerikler yüklenirken bir hata oluştu.');
      }
      const data: ApiProjectPopular[] = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsLoading(false);
      if (isInitialLoad) setIsInitialLoad(false);
    }
  };

  // Arama input'u değiştiğinde veya overlay ilk açıldığında (searchTerm boşsa)
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(''); // Overlay kapanınca arama terimini sıfırla
      setResults([]);
      setIsInitialLoad(true); // Tekrar açıldığında initial load yapsın
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if ((searchTerm.trim() === '' && isInitialLoad) || (searchTerm.trim() === '' && !isInitialLoad && results.length > 0)) {
        setIsLoading(true); // Placeholder'ları göstermek için
        debounceTimeoutRef.current = setTimeout(() => {
            fetchContent('');
        }, searchTerm.trim() === '' && isInitialLoad ? 0 : 300); // İlk yüklemede hemen, silince hafif gecikme
    } else if (searchTerm.trim() !== '') {
        setIsLoading(true); // Placeholder'ları göstermek için
        debounceTimeoutRef.current = setTimeout(() => {
            fetchContent(searchTerm);
        }, 500);
    } else {
        setResults([]); // Arama terimi yok ve initial load da değilse, sonuç yoksa temizle
        setIsLoading(false);
    }
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [searchTerm, isOpen, isInitialLoad]); // isInitialLoad'ı doğru yönetmek önemli

  // Overlay açıldığında input'a focus yap ve ilk içeriği yükle
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) inputRef.current.focus();
      setIsInitialLoad(true); // Overlay her açıldığında initial load tetiklensin
      // fetchContent(''); // Yukarıdaki useEffect zaten searchTerm boşken tetikleyecek
    } else {
      setSearchTerm(''); // Overlay kapanınca inputu temizle
    }
  }, [isOpen]);

  // Tarih formatlama (utils.ts'den import edilebilir veya burada tanımlanabilir)
  const formatDateForCard = (dateString?: string | Date | null): string => {
    if (!dateString) return "Bilinmiyor";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Geçersiz Tarih";
      return `${date.getDate()} ${date.toLocaleString('tr-TR', { month: 'short' })} ${date.getFullYear()}`;
    } catch { return "Geçersiz Tarih"; }
  };
const placeholderCount = searchTerm.trim() === '' ? 9 : 6; // Başlangıçta 9, aramada 6 placeholder
  return (
    <Transition
      show={isOpen} // Animasyonu `isOpen` state'ine bağla
      as={Fragment} // Ekstra bir DOM elementi oluşturma
    >
      {/* 
        Bu `div`, `Dialog.Overlay` gibi çalışır. 
        Tüm ekranı kaplayan karartılmış arka plandır.
        Tıklandığında `onClose` fonksiyonunu çağırır.
      */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
      >
        {/* 
          Transition.Child, asıl animasyonun uygulanacağı element grubunu sarmalar.
          Açılış ve kapanış animasyonları (`enter`, `leave`) bu elemente uygulanır.
        */}
        <Transition.Child
          as="div" // Gerçek bir `div` elementi olarak render et
          className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] h-full sm:h-auto sm:max-h-[85vh]" // Boyutlandırma class'ları
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          {/* 
            Bu iç `div` asıl içerik kutusudur. Tıklama olayının yukarıya (karartılmış alana)
            yayılmasını engellemek için `e.stopPropagation()` kullanır.
          */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-prestij-bg-dark-2 w-full h-full rounded-lg sm:rounded-xl shadow-2xl flex flex-col"
          >
            {/* === BU KISIMDAN SONRASI TAMAMEN AYNI === */}
            
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-prestij-border-soft">
              <h2 className="text-md sm:text-lg font-semibold text-prestij-text-primary">İçerik Ara</h2>
              <button
                onClick={onClose}
                className="text-prestij-text-muted hover:text-prestij-text-bright transition-colors p-1 rounded-full hover:bg-prestij-bg-light-interactive"
                aria-label="Arama penceresini kapat"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Oyun veya anime adı ara..."
                className="w-full p-3 bg-prestij-bg-input border border-prestij-border-input rounded-lg text-prestij-text-input placeholder-prestij-text-placeholder focus:ring-1 focus:ring-prestij-purple focus:border-prestij-purple outline-none transition-colors"
              />

  {/* Sonuç etiketleri ve sayıları */}
{!isLoading && !error && results.length > 0 && (
  <div className="flex flex-wrap gap-2">
    <span className="text-sm text-prestij-text-muted">
      {searchTerm.trim() !== '' ? 'Arama sonuçları:' : 'Sonuçlar:'}
    </span>
    <div className="flex flex-wrap gap-2">
      {/* Oyun sonuç sayısı */}
      {results.filter(item => item.type.toLowerCase() === 'oyun').length > 0 && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-prestij-type-game/20 text-prestij-type-game">
          Oyun ({results.filter(item => item.type.toLowerCase() === 'oyun').length})
        </span>
      )}
      
      {/* Anime sonuç sayısı */}
      {results.filter(item => item.type.toLowerCase() === 'anime').length > 0 && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-prestij-type-anime/20 text-prestij-type-anime">
          Anime ({results.filter(item => item.type.toLowerCase() === 'anime').length})
        </span>
      )}
    </div>
  </div>
)}
</div>

        <div className="flex-grow overflow-y-auto p-3 sm:p-4 custom-scrollbar">
          {/* YÜKLEME DURUMU */}
          {isLoading && (
            <div className={`grid grid-cols-1 xs:grid-cols-2 ${searchTerm.trim() !== '' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-3'} gap-3 sm:gap-4`}>
              {[...Array(placeholderCount)].map((_, index) => (
                <PopularContentCardPlaceholder key={`placeholder-${index}`} />
              ))}
            </div>
          )}

          {/* HATA DURUMU */}
          {!isLoading && error && (
            <p className="text-center text-red-500 py-8">Hata: {error}</p>
          )}

          {/* SONUÇ YOK DURUMU */}
          {!isLoading && !error && results.length === 0 && searchTerm.trim() !== '' && (
            <p className="text-center text-prestij-text-muted py-8">"{searchTerm}" için sonuç bulunamadı.</p>
          )}
          {!isLoading && !error && results.length === 0 && searchTerm.trim() === '' && !isInitialLoad && ( // Initial load bittiyse ve sonuç yoksa
            <p className="text-center text-prestij-text-muted py-8">Gösterilecek içerik bulunamadı bir şeyler yazmayı dene.</p>
          )}

          {!isLoading && !error && results.length > 0 && (
            <div className={`grid grid-cols-1 xs:grid-cols-2 ${searchTerm.trim() !== '' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-3'} gap-3 sm:gap-4`}>
              {/* Arama yapılıyorsa kartlar biraz daha büyük olabilir, başlangıçta daha fazla kart sığabilir */}
              {results.map((item) => (
                <PopularContentCard
                  key={item.id.toString()}
                  slug={item.slug}
                  title={item.title}
                  type={item.type === 'oyun' ? 'Oyun' : 'Anime'} // 'oyun' -> 'Oyun' dönüşümü
                  bannerImageUrl={item.bannerImagePublicId}
                  coverImageUrl={item.coverImagePublicId}
                  description={item.description || ""}
                  date={formatDateForCard(item.createdAt || item.releaseDate)}
                  
                  // === DÜZELTME BURADA: Doğru prop'lara doğru veriyi ata ===
                  likes={item.likeCount}
                  dislikes={item.dislikeCount}
                  favorites={item.favoriteCount}
                  // =========================================================

                  // itemTypePath'i de düzeltelim. Projeler sayfasını kullanıyoruz.
                  itemTypePath={'projeler'}
                  onClick={onClose}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Transition.Child>
  </div>
</Transition>
);
}
export default SearchOverlay;