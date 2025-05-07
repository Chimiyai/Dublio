'use client'; // Oturum bilgisini almak ve çıkış yapmak için Client Component

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Oturum hook'ları

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAdmin = status === 'authenticated' && session?.user?.role === 'admin';

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo veya Site Adı */}
        <Link href="/" className="font-bold text-xl hover:text-gray-300 transition-colors">
          Prestij Dublaj
        </Link>

        {/* Navigasyon Linkleri ve Kullanıcı Durumu */}
        <div className="flex items-center space-x-4">
          {/* Genel Linkler (Herkes görebilir) - Şimdilik yorumlu */}
          {/* <Link href="/projeler" className="hover:text-gray-300">Projeler</Link> */}
          {/* <Link href="/hakkimizda" className="hover:text-gray-300">Hakkımızda</Link> */}

          {/* Oturum Yükleniyor Durumu */}
          {status === 'loading' && (
            <span className="text-sm text-gray-400">Yükleniyor...</span>
          )}

          {/* Kullanıcı Giriş Yapmışsa (Authenticated) */}
          {status === 'authenticated' && session?.user && ( // session?.user kontrolü burada önemli
            <>
              {/* Admin'e Özel Linkler */}
              {isAdmin && (
  <>
    <Link href="/admin" className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 border border-yellow-400 px-2 py-1 rounded">
      Admin Paneli
    </Link>
    <Link href="/admin/projeler" className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 px-2 py-1 rounded">
      Proje Yönetimi
    </Link>
    <Link href="/admin/users" className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 px-2 py-1 rounded">
      Kullanıcı Yönetimi
    </Link>
    <Link href="/admin/sanatcilar" className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 px-2 py-1 rounded"> {/* YENİ LİNK */}
      Sanatçı Yönetimi
    </Link>
  </>
)}

              {/* Tüm Giriş Yapmış Kullanıcılar İçin Ortak Linkler */}
              <Link href="/profil" className="hover:text-gray-300 text-sm">
                {/* session.user burada kesinlikle var çünkü status === 'authenticated' && session?.user kontrolünden geçti */}
                {session.user.name || session.user.email}
              </Link>
              <Link href="/mesajlar" className="hover:text-gray-300 text-sm">
                Mesajlar
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
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