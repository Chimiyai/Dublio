// src/app/mesajlar/layout.tsx
import ConversationsListClient from "@/components/messages/ConversationsListClient";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem))] bg-prestij-chat-bg"> {/* Ana mesajlaşma BG */}
      {/* Sol Panel: Kişiler/Sohbetler Listesi */}
      <div className="w-full sm:w-72 md:w-80 lg:w-96 bg-prestij-sidebar-bg flex flex-col border-r border-prestij-border-dark">
        <div className="p-3 sm:p-4 border-b border-prestij-border-dark sticky top-0 bg-prestij-sidebar-bg z-10">
          <input 
            type="text"
            placeholder="Kişilerde ara..."
            className="w-full px-3 py-2 bg-prestij-input-bg rounded-md text-sm text-prestij-text-primary placeholder-prestij-text-placeholder focus:outline-none focus:ring-1 focus:ring-prestij-500 border border-transparent focus:border-prestij-500"
          />
        </div>
        
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-prestij-border-dark scrollbar-track-prestij-sidebar-bg"> {/* Scrollbar renkleri güncellendi */}
          <ConversationsListClient />
        </div>
      </div>

      {/* Sağ Panel: Aktif Sohbet Penceresi */}
      <div className="flex-grow bg-prestij-chat-bg flex flex-col relative"> {/* Sağ panel için relative eklendi (banner BG için) */}
        {children}
      </div>
    </div>
  );
}