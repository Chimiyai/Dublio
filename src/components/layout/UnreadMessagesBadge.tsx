// src/components/layout/UnreadMessagesBadge.tsx
'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr'; // Veri çekme ve önbellekleme için harika bir kütüphane

// fetcher fonksiyonu, SWR'ın fetch'i nasıl yapacağını belirtir
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function UnreadMessagesBadge() {
  // useSWR, veriyi otomatik olarak çeker, önbellekler ve belirli aralıklarla günceller.
  const { data, error, mutate } = useSWR('/api/messages/unread-count', fetcher, {
    refreshInterval: 30000, // 30 saniyede bir veriyi yeniden çek
  });

  // Belki başka bir sekmede sohbeti okumuştur, pencereye odaklanınca tekrar kontrol et.
  useEffect(() => {
    const handleFocus = () => mutate();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [mutate]);

  const unreadCount = data?.count || 0;

  if (error || unreadCount === 0) {
    return null; // Hata varsa veya okunmamış mesaj yoksa hiçbir şey gösterme
  }

  return (
    <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}