// src/app/mesajlar/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image'; // Veya CldImage
import { UserCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNowStrict } from 'date-fns'; // Son mesaj zamanı için
import { tr } from 'date-fns/locale';

export const metadata = {
  title: 'Mesajlarım | Prestij Dublaj',
};

// Konuşma verisi için tip (API'den dönenle aynı olmalı)
interface Conversation {
  partner: {
    id: number;
    username: string;
    profileImageUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    isSender: boolean;
  };
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  // Middleware zaten koruyor ama ek güvenlik
  if (!session || !session.user?.id) {
    redirect('/giris?callbackUrl=/mesajlar');
  }

  const currentUserId = parseInt(session.user.id, 10);
  if (isNaN(currentUserId)) {
    console.error("Mesajlar sayfasında geçersiz kullanıcı ID'si:", session.user.id);
    redirect('/');
  }

  // API'deki mantığı burada doğrudan kullanalım
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId },
        { receiverId: currentUserId },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      sender: { select: { id: true, username: true, profileImagePublicId: true } },
      receiver: { select: { id: true, username: true, profileImagePublicId: true } },
    },
  });

  const conversationsMap = new Map<number, Conversation>();

  for (const message of messages) {
    const partner = message.senderId === currentUserId ? message.receiver : message.sender;
    if (!conversationsMap.has(partner.id)) {
      conversationsMap.set(partner.id, {
        partner: {
          id: partner.id,
          username: partner.username,
          profileImageUrl: partner.profileImagePublicId,
        },
        lastMessage: {
          content: message.content,
          createdAt: message.createdAt,
          isSender: message.senderId === currentUserId,
        },
      });
    }
  }
  const conversations = Array.from(conversationsMap.values())
                          .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Mesajlarım
        </h1>
        {/* Yeni mesaj başlatma butonu (ileride eklenebilir) */}
        {/* <Link href="/mesajlar/yeni" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center">
          <EnvelopeIcon className="h-5 w-5 mr-2" />
          Yeni Mesaj
        </Link> */}
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-10">
          <EnvelopeIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Henüz hiç mesajlaşmanız bulunmuyor.
          </p>
          {/* Kullanıcı arama ve mesaj başlatma özelliği eklenebilir */}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((convo) => (
              <li key={convo.partner.id}>
                <Link 
                  href={`/mesajlar/${convo.partner.id}`} // Konuşma detay sayfasına link
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150 ease-in-out"
                >
                  <div className="flex items-center px-4 py-4 sm:px-6">
                    <div className="flex-shrink-0 mr-4">
                      {convo.partner.profileImageUrl ? (
                        <Image
                          className="h-12 w-12 rounded-full object-cover"
                          src={convo.partner.profileImageUrl} // Doğrudan URL veya CldImage ile publicID
                          alt={`${convo.partner.username} profil resmi`}
                          width={48}
                          height={48}
                        />
                      ) : (
                        <UserCircleIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {convo.partner.username}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            {formatDistanceToNowStrict(new Date(convo.lastMessage.createdAt), { addSuffix: true, locale: tr })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {convo.lastMessage.isSender && <span className="font-semibold">Sen: </span>}
                          {convo.lastMessage.content}
                        </p>
                      </div>
                    </div>
                    {/* Okunmamış mesaj sayısı veya bildirim ikonu eklenebilir */}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}