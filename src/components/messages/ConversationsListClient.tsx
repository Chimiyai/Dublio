// src/components/messages/ConversationsListClient.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } // useRouter eklendi
from 'next/navigation';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import NextImage from 'next/image'; // NextImage kullanıyoruz
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ConversationUser {
  id: number;
  username: string;
  profileImagePublicId: string | null;
  // onlineStatus?: string; // Ekran görüntüsündeki gibi
}

interface Conversation {
  user: ConversationUser;
  lastMessage: string;
  lastMessageAt: string; // ISO date string
  // unreadCount?: number;
}

export default function ConversationsListClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams(); // Aktif sohbeti belirlemek için
  const router = useRouter(); // Yönlendirme için

  const activeChatUserId = params.userId ? parseInt(params.userId as string) : null;

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/messages/conversations');
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Sohbetler yüklenemedi.');
        }
        const data: Conversation[] = await response.json();
        setConversations(data);

        // Eğer hiç aktif sohbet yoksa ve konuşmalar varsa, ilk konuşmaya yönlendir (isteğe bağlı)
        // if (!activeChatUserId && data.length > 0 && typeof window !== 'undefined') {
        //    router.replace(`/mesajlar/${data[0].user.id}`);
        // }

      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
    // Periyodik olarak fetch etme eklenebilir
    // const intervalId = setInterval(fetchConversations, 30000); // 30 saniyede bir
    // return () => clearInterval(intervalId);
  }, [activeChatUserId, router]); // activeChatUserId değiştiğinde de çalışabilir ama genelde gerek yok

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
    return <p className="p-4 text-red-400 text-sm">Hata: {error}</p>;
  }

  if (conversations.length === 0) {
    return <p className="p-4 text-gray-400 text-sm">Henüz hiç sohbetiniz yok.</p>;
  }

  return (
    <nav className="flex-1 py-2 px-1.5 sm:px-2 space-y-0.5">
      {conversations.map((convo) => {
        const isActive = activeChatUserId === convo.user.id;
        const avatarUrl = convo.user.profileImagePublicId
          ? getCloudinaryImageUrlOptimized(convo.user.profileImagePublicId, { width: 40, height: 40, crop: 'fill', gravity: 'face' }, 'avatar')
          : null; // Veya varsayılan avatar yolu

        return (
          <Link
            key={convo.user.id}
            href={`/mesajlar/${convo.user.id}`}
            className={cn(
              "flex items-center space-x-3 p-2.5 rounded-lg hover:bg-prestij-input-bg/70 transition-colors group relative", // Hover rengi güncellendi
              isActive 
                ? "bg-prestij-input-bg text-prestij-text-primary" // Aktif arka plan güncellendi
                : "text-prestij-text-secondary hover:text-prestij-text-primary"
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
                  isActive ? "text-white" : "text-prestij-text-primary group-hover:text-white"
              )}>
                {convo.user.username}
              </p>
              <p className={cn(
                  "text-xs truncate", 
                  isActive ? "text-prestij-text-secondary" : "text-prestij-text-muted group-hover:text-prestij-text-secondary"
              )}>
                {convo.lastMessage}
              </p>
            </div>
            <div className="flex-shrink-0 text-xs text-prestij-text-muted self-start pt-0.5">
              {formatDistanceToNowStrict(new Date(convo.lastMessageAt), { locale: tr, addSuffix: false })}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
