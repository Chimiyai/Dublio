// src/app/mesajlar/[userId]/page.tsx
'use client';

import { useState, useEffect, useTransition, FormEvent, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { UserCircleIcon, PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Tipler (API'den dönenlerle uyumlu olmalı)
interface Message {
  id: number;
  content: string;
  createdAt: string; // API'den string olarak gelebilir, Date'e çevrilmeli
  senderId: number;
  sender: {
    id: number;
    username: string;
    profileImageUrl: string | null;
  };
}
interface PartnerUser {
    id: number;
    username: string;
    profileImageUrl: string | null;
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams(); // Dinamik route parametresini almak için
  const { data: session, status: sessionStatus } = useSession();

  const partnerId = parseInt(params.userId as string, 10);

  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, startSendingTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null); // Mesajların en altına scroll için

  // Mesajları ve partner bilgisini çekme
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !isNaN(partnerId)) {
      const fetchConversation = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/messages/${partnerId}`);
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Mesajlar yüklenemedi.');
          }
          const data = await response.json();
          setMessages(data.messages);
          setPartnerUser(data.partnerUser);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchConversation();
    } else if (sessionStatus === 'unauthenticated') {
        router.push('/giris?callbackUrl=/mesajlar'); // veya mevcut sayfa
    }
  }, [partnerId, sessionStatus, router]);

  // Yeni mesaj geldiğinde en alta scroll et
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMessage.trim() || isNaN(partnerId) || !session?.user?.id) return;

    startSendingTransition(async () => {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: partnerId,
            content: newMessage.trim(),
          }),
        });
        const sentMessageData = await response.json();
        if (!response.ok) {
          throw new Error(sentMessageData.message || 'Mesaj gönderilemedi.');
        }
        // Gönderilen mesajı listeye ekle (optimistic update gibi)
        // API'den dönen mesajın tipi Message ile uyumlu olmalı
        setMessages(prevMessages => [...prevMessages, sentMessageData as Message]);
        setNewMessage(''); // Input'u temizle
      } catch (err: any) {
        // Hata mesajını kullanıcıya göster
        setError(err.message || 'Mesaj gönderilirken bir hata oluştu.');
      }
    });
  };
  
  if (sessionStatus === 'loading' || (isLoading && !partnerUser)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) { // Eğer session yoksa (useEffect içindeki redirect'e ek olarak)
    return <p className="text-center mt-10">Mesajları görmek için giriş yapmalısınız.</p>;
  }
  
  if (error && !isLoading) { // Eğer yükleme bitti ve hata varsa
     return <p className="text-center mt-10 text-red-500">Hata: {error}</p>;
  }

  if (!partnerUser) {
      return <p className="text-center mt-10">Kullanıcı bulunamadı veya konuşma yüklenemedi.</p>;
  }


  return (
    <div className="container mx-auto max-w-3xl h-[calc(100vh-var(--navbar-height,4rem))] flex flex-col"> {/* Navbar yüksekliğini hesaba kat */}
      {/* Başlık - Konuşulan Kişi */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm p-4 border-b dark:border-gray-700">
        <div className="flex items-center">
          <Link href="/mesajlar" className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </Link>
          {partnerUser.profileImageUrl ? (
            <Image
              src={partnerUser.profileImageUrl}
              alt={partnerUser.username}
              width={40}
              height={40}
              className="rounded-full object-cover mr-3"
            />
          ) : (
            <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mr-3" />
          )}
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {partnerUser.username}
          </h1>
        </div>
      </div>

      {/* Mesaj Listesi */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === parseInt(session.user!.id!, 10) ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                msg.senderId === parseInt(session.user!.id!, 10)
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.senderId === parseInt(session.user!.id!, 10) ? 'text-indigo-200 text-right' : 'text-gray-400 dark:text-gray-500 text-left'}`}>
                {format(new Date(msg.createdAt), 'p', { locale: tr })} {/* Sadece saat */}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Scroll için boş div */}
      </div>

      {/* Mesaj Gönderme Formu */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSending ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ): (
                 <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}