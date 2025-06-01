// src/app/mesajlar/[userId]/page.tsx
import ChatWindowClient, { MessageUser } from "@/components/messages/ChatWindowClient";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; // GÜNCELLENMİŞ İMPORT YOLU
import { notFound } from "next/navigation";

// ChatPageProps interface'ini kaldırıyoruz.
// interface ChatPageProps {
//   params: {
//     userId: string;
//   };
// }

export default async function ChatPage(
  { params }: { params: Promise<{ userId: string }> } // params'ı Promise olarak al
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return notFound(); // Veya redirect('/giris');
  }

  const resolvedParams = await params; // params'ı çöz
  const otherUserIdString = resolvedParams.userId;

  if (!otherUserIdString || typeof otherUserIdString !== 'string' || otherUserIdString.trim() === "") {
    console.error("ChatPage: Eksik veya geçersiz userId parametresi.");
    return notFound(); // Veya uygun bir hata mesajı göster
  }

  const currentUserId = parseInt(session.user.id);
  const otherUserId = parseInt(otherUserIdString);

  if (isNaN(otherUserId) || currentUserId === otherUserId) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
            <p className="text-lg">Geçersiz sohbet.</p>
            <p className="text-sm">Lütfen geçerli bir kullanıcı seçin.</p>
        </div>
    );
  }

  const otherUserDb = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { 
        id: true, 
        username: true, 
        profileImagePublicId: true, 
        bannerImagePublicId: true 
    },
  });

  if (!otherUserDb) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
            <p className="text-lg">Kullanıcı bulunamadı.</p>
        </div>
    );
  }

  const otherUserDataForClient: MessageUser = {
      id: otherUserDb.id,
      username: otherUserDb.username,
      profileImagePublicId: otherUserDb.profileImagePublicId,
      bannerImagePublicId: otherUserDb.bannerImagePublicId
  };

  return (
    <ChatWindowClient 
        currentUserId={currentUserId} 
        otherUser={otherUserDataForClient}
    />
  );
}