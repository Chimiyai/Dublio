// src/components/messages/ConversationsListClient.tsx
'use client';

import { useEffect, useState, useMemo } from 'react'; // useMemo eklendi
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { UserCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'; // Arama ikonu eklendi
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import NextImage from 'next/image';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import useSWR from 'swr'; // SWR'ı periyodik veri çekme için kullanalım

interface ConversationUser {
  id: number;
  username: string;
  profileImagePublicId: string | null;
}

interface Conversation {
  user: ConversationUser;
  lastMessageContent: string;
  lastMessageAt: string;
  unreadCount: number; // API'den bu verinin geldiğini varsayıyoruz
  isLastMessageSentByMe: boolean;
}

// SWR için fetcher fonksiyonu
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ConversationsListClient() {
  // Veriyi SWR ile çekiyoruz, böylece periyodik olarak güncellenir
  const { data: conversations, error, isLoading } = useSWR<Conversation[]>(
    '/api/messages/conversations', 
    fetcher,
    { refreshInterval: 15000 } // Her 15 saniyede bir sohbet listesini yenile
  );

  // Arama state'i
  const [searchTerm, setSearchTerm] = useState('');
  
  const params = useParams();
  const activeChatUserId = params.userId ? parseInt(params.userId as string) : null;

  // Arama mantığı
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchTerm.trim()) {
      return conversations;
    }
    return conversations.filter(convo =>
      convo.user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);


  if (isLoading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded-md">
            <div className="w-10 h-10 bg-prestij-input-bg rounded-full"></div> {/* Placeholder rengi */}
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-prestij-input-bg rounded w-3/4"></div>
              <div className="h-2 bg-prestij-input-bg rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="p-4 text-red-400 text-sm">Sohbetler yüklenemedi...</p>;
  }

  if (!conversations || conversations.length === 0) {
    return <p className="p-4 text-gray-400 text-sm text-center">Henüz hiç sohbetiniz yok.</p>;
  }

  return (
    // Component'i flex ve dikey yapıya çeviriyoruz
    <div className="flex flex-col h-full">
        {/* Arama Çubuğu */}
        <div className="p-3 sm:p-4 border-b border-prestij-border-dark">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-prestij-text-muted" />
                </div>
                <input
                    type="search"
                    placeholder="Sohbetlerde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-prestij-input-bg rounded-md text-sm text-prestij-text-primary placeholder-prestij-text-placeholder focus:outline-none focus:ring-1 focus:ring-prestij-500 border border-transparent focus:border-prestij-500"
                />
            </div>
        </div>
        
        {/* Sohbet Listesi (Kaydırılabilir Alan) */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-prestij-border-dark scrollbar-track-transparent py-2 px-1.5 sm:px-2 space-y-0.5">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((convo) => {
            const isActive = activeChatUserId === convo.user.id;
            const avatarUrl = convo.user.profileImagePublicId ? getCloudinaryImageUrlOptimized(convo.user.profileImagePublicId, { width: 40, height: 40, crop: 'fill', gravity: 'face' }, 'avatar') : null;
            const hasUnread = convo.unreadCount > 0;

            return (
              <Link
                key={convo.user.id}
                href={`/mesajlar/${convo.user.id}`}
                className={cn(
                  "flex items-center space-x-3 p-2.5 rounded-lg hover:bg-prestij-input-bg/70 transition-colors group relative",
                  isActive ? "bg-prestij-input-bg" : "text-prestij-text-secondary hover:text-prestij-text-primary"
                )}
              >
            {isActive && ( // Aktiflik çizgisi
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-prestij-500 rounded-r-md"></span>
            )}
            <div className={cn("relative flex-shrink-0", isActive ? "ml-1.5" : "ml-0.5")}> {/* Aktifken avatar kaydırması */}
              {avatarUrl ? (
                <NextImage
                  src={avatarUrl}
                  alt={convo.user.username}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-10 h-10 text-prestij-gray-500" />
              )}
              {/* Online Durum Göstergesi (Örnek - Bu veri backend'den gelmeli) */}
              {/* {convo.user.onlineStatus === 'online' && (
                 <span className="absolute bottom-0 right-0 block h-3 w-3 bg-green-500 rounded-full ring-2 ring-prestij-dark-800" />
              )} */}
            </div>
            <div className="flex-1 min-w-0">
                  <p className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-white" : "text-prestij-text-primary group-hover:text-white",
                      hasUnread && !isActive && "font-bold"
                  )}>
                    {convo.user.username}
                  </p>
              <p className={cn(
                  "text-xs truncate", 
                  isActive ? "text-prestij-text-secondary" : "text-prestij-text-muted group-hover:text-prestij-text-secondary",
                  hasUnread && !isActive ? "text-white font-medium" : "" // Eğer aktif değilse ve okunmamışsa son mesajı da belirgin yap
              )}>
                {/* Son mesajı gönderen ben isem: "Siz: Mesaj..." */}
                {convo.isLastMessageSentByMe && 'Siz: '}
                {convo.lastMessageContent}
              </p>
            </div>

                <div className="flex flex-col items-end space-y-1.5 self-start pt-0.5">
                    <span className="text-xs text-prestij-text-muted">
                      {formatDistanceToNowStrict(new Date(convo.lastMessageAt), { locale: tr, addSuffix: false })}
                    </span>
                    
                    {/* OKUNMAMIŞ MESAJ SAYISI ROZETİ */}
                    {hasUnread && (
                        <span className={cn(
                        "flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold text-white",
                        "bg-red-500"
                    )}>
                        {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                    </span>
                    )}
                </div>
              </Link>
            );
          })
        ) : (
            <p className="p-4 text-gray-400 text-sm text-center">Aramanızla eşleşen sohbet bulunamadı.</p>
        )}
        </nav>
    </div>
  );
}