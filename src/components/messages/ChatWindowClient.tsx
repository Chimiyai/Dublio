// src/components/messages/ChatWindowClient.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { UserCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import NextImage from 'next/image';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Tipler
export interface MessageUser { // Bu tipi export etmiştik
  id: number;
  username: string;
  profileImagePublicId: string | null;
  bannerImagePublicId?: string | null;
}

interface Message {
  id: number; // API'den gelen gerçek ID
  tempId?: string; // YENİ: Client-side optimistic update için geçici ID
  content: string;
  createdAt: string;
  sender: MessageUser;
}

interface ChatWindowClientProps {
  currentUserId: number;
  otherUser: MessageUser;
}

interface FetchMessagesResponse {
    messages: Message[];
    totalPages: number;
    currentPage: number;
    totalMessages: number;
}

function MessageItem({ message, isSender }: { message: Message; isSender: boolean }) {
  const avatarUrl = message.sender.profileImagePublicId
    ? getCloudinaryImageUrlOptimized(message.sender.profileImagePublicId, { width: 32, height: 32, crop: 'fill', gravity: 'face' }, 'avatar')
    : null;

  return (
    <div className={cn("flex items-end gap-2.5 py-1.5 px-1", isSender ? "justify-end" : "justify-start")}>
      {!isSender && (
        <Link href={`/profil/${message.sender.username}`} className="flex-shrink-0 self-end mb-1 group">
          {avatarUrl ? (
             <NextImage src={avatarUrl} alt={message.sender.username} width={36} height={36} className="rounded-full object-cover"/>
          ) : (
            <UserCircleIcon className="w-9 h-9 text-prestij-gray-500" />
          )}
        </Link>
      )}
      {/* Mesaj Baloncuğu */}
      <div 
        className={cn(
            "max-w-[70%] sm:max-w-[65%] p-3 rounded-xl shadow-md min-w-0", // Daha belirgin köşe, padding ayarlandı
            isSender 
                ? "bg-prestij-500 text-white rounded-br-md" // Kendi mesajın
                : "bg-prestij-message-other text-prestij-text-primary rounded-bl-md" // Diğerinin mesajı
        )}
      >
        {/* Gönderen Adı (Alıcı mesajları için) */}
        {!isSender && (
            <Link href={`/profil/${message.sender.username}`}>
                <p className="text-xs font-semibold text-prestij-300 mb-1 hover:underline">{message.sender.username}</p>
            </Link>
        )}
        <p 
  className="text-sm whitespace-pre-wrap leading-snug" 
  style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }} // DOĞRUDAN CSS EKLENDİ
>
  {message.content}
</p>
        <p className={cn("text-[10px] mt-1.5 opacity-60", isSender ? "text-right" : "text-left")}>
          {format(new Date(message.createdAt), 'HH:mm', { locale: tr })}
        </p>
      </div>
    </div>
  );
}

export default function ChatWindowClient({ currentUserId, otherUser }: ChatWindowClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false); // "Daha fazla yükle" için
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const fetchMessages = useCallback(async (page = 1, loadMore = false) => {
    if(!otherUser?.id) return;
    if (!loadMore) setIsLoading(true); else setIsLoadingMessages(true);
    setError(null);
    try {
      const response = await fetch(`/api/messages/${otherUser.id}?page=${page}&limit=20`);
      if (!response.ok) { 
        const errData = await response.json().catch(() => ({message: 'Mesajlar yüklenemedi (yanıt okunamadı)'}));
        throw new Error(errData.message || 'Mesajlar yüklenemedi.');
      }
      const data: FetchMessagesResponse = await response.json();
      
      setMessages(prev => loadMore ? [...data.messages, ...prev] : data.messages);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);

      if (!loadMore) {
        setTimeout(() => scrollToBottom('auto'), 100); // Biraz gecikme ekleyebiliriz render sonrası için
      }
    } catch (err: any) { 
        setError(err.message); 
        console.error("fetchMessages error:", err);
    }
    finally { if (!loadMore) setIsLoading(false); else setIsLoadingMessages(false); }
  }, [otherUser?.id]);

  useEffect(() => {
    if (otherUser?.id) {
        setMessages([]);
        setCurrentPage(1);
        setTotalPages(1);
        fetchMessages(1);
    }
  }, [otherUser?.id, fetchMessages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUser?.id) return;
    
    const tempId = `temp-${Date.now()}-${Math.random()}`; // tempId burada tanımlanıyor
    const optimisticMessage: Message = {
        id: 0, // Geçici, backend'den gerçek ID gelecek
        tempId: tempId, // Tanımlanan tempId kullanılıyor
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        sender: {
            id: currentUserId,
            username: "Siz", // Veya session'dan gerçek kullanıcı adı
            profileImagePublicId: null, // Veya session'dan gerçek avatar
            bannerImagePublicId: null, // Bu mesaj objesi için gerekmeyebilir
        }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage.trim(); // Gönderilecek mesajı sakla
    setNewMessage(''); // Input'u hemen temizle
    setTimeout(() => scrollToBottom('smooth'), 0);

    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/${otherUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageToSend }), // Saklanan mesajı gönder
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({message: 'Mesaj gönderilemedi (yanıt okunamadı)'}));
        setMessages(prev => prev.filter(m => m.tempId !== tempId)); // Optimistic geri al
        throw new Error(errData.message || 'Mesaj gönderilemedi.');
      }
      const sentMessage: Message = await response.json();
      // Optimistic mesajı gerçek mesajla değiştir
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...sentMessage, tempId: undefined } : m)); // tempId'yi kaldırabiliriz
    } catch (err: any) {
      toast.error(err.message);
      // Hata durumunda da optimistic mesajı kaldır (yukarıda zaten yapıldı)
      // setMessages(prev => prev.filter(m => m.tempId !== tempId));
    } finally {
      setIsSending(false);
    }
  };
  
  const loadMoreMessages = () => {
      if (currentPage < totalPages && !isLoadingMessages) { // isLoading yerine isLoadingMessages
          fetchMessages(currentPage + 1, true);
      }
  };

// otherUserAvatarUrl ve otherUserBannerUrl TANIMLAMALARI BURADA OLMALI
  const otherUserAvatarUrl = otherUser.profileImagePublicId
    ? getCloudinaryImageUrlOptimized(otherUser.profileImagePublicId, { width: 36, height: 36, crop: 'fill', gravity: 'face' }, 'avatar')
    : null;

  const otherUserBannerUrl = otherUser.bannerImagePublicId
    ? getCloudinaryImageUrlOptimized(otherUser.bannerImagePublicId, { width: 800, height: 240, quality: 'auto', crop: 'fill', gravity: 'auto' }, 'banner')
    : null;

  return (
    <div className="flex flex-col h-full bg-prestij-chat-bg relative overflow-hidden">
      {/* Arka Plan Banner Bölümü */}
      <div className="absolute inset-x-0 top-0 h-[35vh] sm:h-[40vh] z-0 pointer-events-none">
        {otherUserBannerUrl && ( // otherUserBannerUrl burada kullanılıyor
          <div className="relative w-full h-full">
            <NextImage
              src={otherUserBannerUrl} // otherUserBannerUrl burada kullanılıyor
              alt=""
              fill
              className="object-cover opacity-20 dark:opacity-15"
              priority
            />
            <div className="absolute inset-0 bg-chat-banner-gradient z-[1]"></div>
          </div>
        )}
      </div>

      {/* Üstteki Header (Kullanıcı Bilgisi) */}
      <div className="flex items-center p-3 sm:p-4 border-b border-prestij-border-dark/30 bg-transparent sticky top-0 z-20">
        <Link href={`/profil/${otherUser.username}`} className="flex-shrink-0 group">
          {otherUserAvatarUrl ? (
            <NextImage src={otherUserAvatarUrl} alt={otherUser.username} width={36} height={36} className="rounded-full mr-3 group-hover:opacity-80 transition-opacity"/>
          ) : (
            <UserCircleIcon className="w-9 h-9 text-prestij-text-secondary mr-3 group-hover:text-prestij-text-primary transition-colors"/>
          )}
        </Link>
        <Link href={`/profil/${otherUser.username}`}>
            {/* BU KISIM KULLANICI ADINI GÖSTERMELİ */}
            <h2 className="text-base sm:text-lg font-semibold text-prestij-text-primary hover:underline">
              {otherUser.username} {/* otherUser.username BURADA KULLANILIYOR MU? */}
            </h2>
        </Link>
      </div>

      {/* Mesaj Listesi */}
      <div 
        ref={chatContainerRef} 
        className="flex-grow p-3 sm:p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-prestij-border-dark scrollbar-track-transparent relative z-10 flex flex-col" // flex flex-col eklendi
      >
        {/* "Daha Fazla Yükle" Butonu (Listenin en üstünde) */}
        {currentPage < totalPages && !isLoadingMessages && (
            <div className="text-center my-3">
                <button 
                    onClick={loadMoreMessages}
                    disabled={isLoadingMessages}
                    className="text-xs text-prestij-300 hover:underline disabled:opacity-50"
                >
                    {isLoadingMessages ? "Yükleniyor..." : "Önceki mesajları yükle"}
                </button>
            </div>
        )}
        {isLoading && messages.length === 0 && <div className="text-center text-prestij-text-secondary py-10 m-auto">Mesajlar yükleniyor...</div>} {/* m-auto eklendi */}
        {!isLoading && messages.length === 0 && !error && (
          <p className="text-center text-gray-400">Henüz hiç mesaj yok. İlk mesajı sen gönder!</p>
        )}
        
        {/* "Daha Fazla Yükle" Butonu */}
        {currentPage < totalPages && !isLoading && (
            <div className="text-center my-2">
                <button 
                    onClick={loadMoreMessages}
                    className="text-xs text-prestij-300 hover:underline"
                >
                    Önceki mesajları yükle
                </button>
            </div>
        )}

        {/* Mesajlar zaten eskiden yeniye sıralı olduğu için direkt map'liyoruz */}
        {messages.map((msg) => (
          // MessageItem key'i için (msg as any).tempId ?? msg.id kullanabiliriz
          <MessageItem key={(msg as any).tempId ?? msg.id} message={msg} isSender={msg.sender.id === currentUserId} />
        ))}
        <div ref={messagesEndRef} /> {/* Scroll için boş div (her zaman en altta) */}
      </div>

      {/* Mesaj Gönderme Formu */}
      <div className="p-3 sm:p-4 border-t border-prestij-border-dark/50 bg-prestij-chat-bg/90 backdrop-blur-sm sticky bottom-0 z-20">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`${otherUser.username} kullanıcısına mesaj yaz...`}
            className="flex-grow px-4 py-2.5 bg-prestij-input-bg rounded-lg text-sm text-prestij-text-primary focus:outline-none focus:ring-1 focus:ring-prestij-500 placeholder-prestij-text-placeholder border border-transparent focus:border-prestij-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="p-2.5 bg-prestij-500 hover:bg-prestij-600 text-white rounded-lg disabled:opacity-50 transition-colors flex-shrink-0"
            title="Gönder"
          >
            <PaperAirplaneIcon className="w-5 h-5" /> {/* Transform kaldırıldı, ikon zaten doğru yönde */}
          </button>
        </form>
      </div>
    </div>
  );
}