// src/components/auth/SignOutButton.tsx
'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // useRouter'ı import et
import { useState } from 'react';

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // router'ı kullanıma hazırla

  const handleSignOut = async () => {
    setIsLoading(true);

    // 1. NextAuth'a çıkış işlemini yapmasını ama hiçbir yere yönlendirmemesini söyle.
    // Bu, arka planda session'ı ve çerezleri temizler.
    await signOut({ redirect: false });

    // 2. Çıkış işlemi bittikten sonra, kullanıcıyı biz manuel olarak anasayfaya yönlendirelim.
    // `router.push` yerine `window.location.href` kullanmak, tam sayfa yenilemesi
    // yaparak tüm eski state'lerin temizlenmesini garanti eder.
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 disabled:opacity-50 disabled:cursor-wait"
    >
      {isLoading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
    </button>
  );
}