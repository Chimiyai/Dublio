// src/app/mesajlar/[userId]/page.tsx
import ChatWindowClient, { MessageUser } from "@/components/messages/ChatWindowClient"; // MessageUser'ı import et
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";

interface ChatPageProps {
  params: {
    userId: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return notFound();
  }

  const currentUserId = parseInt(session.user.id); // Non-null assertion yapmadan önce kontrol et
  const otherUserId = parseInt(params.userId);

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