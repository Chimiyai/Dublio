// src/app/mesajlar/layout.tsx
'use client'; // Bu layoutun Client Component olduğunu belirtiyoruz

import { useEffect } from 'react'; // useEffect hook'unu import ediyoruz
import ConversationsListClient from "@/components/messages/ConversationsListClient";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Layout yüklendiğinde body'nin kaydırmasını devre dışı bırak
    document.body.style.overflow = 'hidden';

    // Layout kaldırıldığında body'nin kaydırmasını geri aç
    return () => {
      document.body.style.overflow = 'unset'; // veya 'auto' kullanabilirsiniz
    };
  }, []); // Boş dependency array, bu effect'in sadece mount ve unmount'ta çalışmasını sağlar

  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem))] bg-dublio-chat-bg"> {/* Ana mesajlaşma BG */}

      <div className="w-full sm:w-72 md:w-80 lg:w-96 bg-dublio-sidebar-bg flex flex-col border-r border-dublio-border-dark">
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-dublio-border-dark scrollbar-track-dublio-sidebar-bg"> {/* Scrollbar renkleri güncellendi */}
          <ConversationsListClient />
        </div>
      </div>

      {/* Sağ Panel: Aktif Sohbet Penceresi */}
      <div className="flex-grow bg-dublio-chat-bg flex flex-col relative"> {/* Sağ panel için relative eklendi (banner BG için) */}
        {children}
      </div>
    </div>
  );
}