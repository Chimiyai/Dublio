// src/app/mesajlar/page.tsx
// Bu sayfa, messages/layout.tsx içindeki {children} kısmına render olacak.

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
      {/* İsteğe bağlı: Logo veya ikon eklenebilir */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 mb-4 text-gray-600 dark:text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25S3.75 16.556 3.75 12D3.75 7.444 7.61 3.75 12.375 3.75S21 7.444 21 12Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
      <p className="text-lg">Bir sohbet seçin</p>
      <p className="text-sm">Sohbeti başlatmak için sol taraftaki listeden bir kişi seçin.</p>
    </div>
  );
}