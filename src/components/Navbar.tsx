// src/components/Navbar.tsx
'use client'; // Oturum bilgisini almak ve çıkış yapmak için Client Component

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Oturum hook'ları

export default function Navbar() {
  // useSession hook'u client tarafında oturum bilgilerini almak için kullanılır.
  // data: Oturum bilgileri (session nesnesi) veya null (oturum yoksa).
  // status: Oturumun durumu ('loading', 'authenticated', 'unauthenticated').
  const { data: session, status } = useSession();

  // Kullanıcının rolünü kontrol et (opsiyonel ama kullanışlı)
  const isAdmin = session?.user?.role === 'admin';

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo veya Site Adı */}
        <Link href="/" className="font-bold text-xl hover:text-gray-300 transition-colors">
          Prestij Dublaj
        </Link>

        {/* Navigasyon Linkleri ve Kullanıcı Durumu */}
        <div className="flex items-center space-x-4">
          {/* Genel Linkler (Herkes görebilir) */}
          {/* <Link href="/projeler" className="hover:text-gray-300">Projeler</Link> */}
          {/* <Link href="/hakkimizda" className="hover:text-gray-300">Hakkımızda</Link> */}

          {/* Oturum Yükleniyor Durumu */}
          {status === 'loading' && (
            <span className="text-sm text-gray-400">Yükleniyor...</span>
          )}

          {/* Kullanıcı Giriş Yapmışsa (Authenticated) */}
          {status === 'authenticated' && session?.user && (
            <>
              {/* Admin Paneli Linki (Sadece adminler için) */}
              {isAdmin && (
                <Link href="/admin" className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 border border-yellow-400 px-2 py-1 rounded">
                  Admin Paneli
                </Link>
              )}

              {/* Profil Linki */}
               <Link href="/profil" className="hover:text-gray-300 text-sm">
                 {session.user.name || session.user.email} {/* Kullanıcı adı veya e-posta */}
               </Link>

               {/* Mesajlar Linki */}
               <Link href="/mesajlar" className="hover:text-gray-300 text-sm">
                 Mesajlar
               </Link>

              {/* Çıkış Yap Butonu */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })} // Çıkış yap ve ana sayfaya yönlendir
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
              >
                Çıkış Yap
              </button>
            </>
          )}

          {/* Kullanıcı Giriş Yapmamışsa (Unauthenticated) */}
          {status === 'unauthenticated' && (
            <>
              <Link href="/giris" className="hover:text-gray-300 text-sm">
                Giriş Yap
              </Link>
              <Link href="/kayit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}