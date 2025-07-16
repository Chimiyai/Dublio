// src/middleware.ts (GÜVENLİ VE DOĞRU SIRALAMALI VERSİYON)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname.startsWith('/giris') || pathname.startsWith('/kayit');

  // --- 1. Kural: Admin Sayfaları ---
  // Eğer admin sayfasına gitmeye çalışıyorsa:
  if (isAdminPage) {
    // === DÜZELTME BURADA ===
    // 'admin' yerine veritabanındaki gibi 'ADMIN' kullanıyoruz.
    if (!token || token.role !== 'ADMIN') { 
      console.log(`Admin page access denied. Token role: ${token?.role}`); // Hata ayıklama için log
      return NextResponse.redirect(new URL('/giris', req.url));
    }
    // =======================

    // Eğer admin ise, geçişe izin ver.
    console.log(`Admin page access granted for role: ${token.role}`); // Hata ayıklama için log
    return NextResponse.next();
  }

  // --- 2. Kural: Giriş Yapmış Kullanıcılar ---
  // Eğer kullanıcı giriş yapmışsa (token varsa):
  if (token) {
    // a) Ban durumunu kontrol et
    const isBanned = token.isBanned ?? false;
    const banExpires = token.banExpiresAt ? new Date(token.banExpiresAt as string) : null;
    const isBanActive = isBanned && (!banExpires || banExpires > new Date());
    
    // Eğer banlıysa ve anasayfa dışında bir yere gitmeye çalışıyorsa -> Ban sayfasına yönlendir.
    if (isBanActive && pathname !== '/' && pathname !== '/banlandiniz') {
      return NextResponse.redirect(new URL('/banlandiniz', req.url));
    }
    
    // b) Zaten giriş yapmışken giriş/kayıt sayfalarına gitmesini engelle
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/', req.url)); // Profiline veya anasayfaya yönlendir
    }

    // Banlı değilse ve auth sayfasına gitmiyorsa, geçişe izin ver.
    return NextResponse.next();
  }

  // --- 3. Kural: Giriş Yapmamış Kullanıcılar ---
  // Eğer bu noktaya geldiysek, kullanıcı giriş yapmamıştır.
  const publicRoutes = ['/', '/giris', '/kayit', '/projeler']; 
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  // Eğer sayfa public ise, izin ver.
  if (isPublic) {
    return NextResponse.next();
  }

  // Eğer sayfa public değilse (örn: /profil, /mesajlar), giriş sayfasına yönlendir.
  const url = new URL('/giris', req.url);
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // API rotalarını, statik dosyaları ve resimleri middleware'den hariç tutuyoruz.
  // Bu, gereksiz kontrolleri azaltır ve performansı artırır.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|sounds).*)',
  ],
};