// src/middleware.ts (Banlı kullanıcı sadece anasayfayı görebilir)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // --- 1. Adım: Önce BAN KONTROLÜNÜ yap (En Yüksek Öncelik) ---
  if (token) {
    const isBanned = token.isBanned ?? false;
    const banExpires = token.banExpiresAt ? new Date(token.banExpiresAt as string) : null;
    const isBanActive = isBanned && (!banExpires || banExpires > new Date());

    // Banlı bir kullanıcının GİREBİLECEĞİ sayfalar/yollar
    const bannedUserAllowedPaths = ['/', '/banlandiniz']; 

    // Eğer kullanıcı BANLIYSA ve girmeye çalıştığı sayfa İZİN VERİLENLER arasında DEĞİLSE,
    // onu /banlandiniz sayfasına yönlendir.
    if (isBanActive && !bannedUserAllowedPaths.includes(pathname)) {
        // API veya statik dosya isteklerini bu kuraldan muaf tutalım ki sayfa bozulmasın.
        if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next') && !pathname.includes('.')) {
            const url = new URL('/banlandiniz', req.url);
            return NextResponse.redirect(url);
        }
    }
  }

  // --- 2. Adım: Herkesin Erişebileceği (Public) Rotaları Belirle ---
  // Not: Anasayfa (/) zaten banlı kullanıcılar için yukarıda kontrol edildi,
  // banlı olmayanlar veya giriş yapmamışlar için burada da public olmalı.
  const publicRoutes = ['/', '/giris', '/kayit', '/projeler']; 
  const isPublicResource = publicRoutes.some(route => pathname.startsWith(route)) ||
                           pathname.startsWith('/api/') ||
                           pathname.startsWith('/_next') ||
                           pathname.includes('.');

  // Eğer sayfa herkese açıksa (ve ban kontrolünden geçtiyse), izin ver.
  if (isPublicResource) {
    return NextResponse.next();
  }

  // --- 3. Adım: Giriş Yapmamış Kullanıcıları Korumalı Sayfalardan Yönlendir ---
  // Eğer bu noktaya geldiysek, sayfa public değil demektir.
  // Giriş yapmamış bir kullanıcı korumalı bir sayfaya (örn: /profil) gitmeye çalışıyorsa...
  if (!token) {
    const url = new URL('/giris', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // --- 4. Adım: Sadece Giriş Yapmış Kullanıcılar İçin Özel Kontroller ---
  // Örneğin, admin paneli kontrolü
  const isAdminPage = pathname.startsWith('/admin');
  if (isAdminPage && token.role !== 'admin') {
    const url = new URL('/', req.url); // Anasayfaya yönlendir
    return NextResponse.redirect(url);
  }

  // Yukarıdaki hiçbir kurala takılmadıysa, isteğe izin ver.
  return NextResponse.next();
}

export const config = {
  // `matcher` tüm yolları kapsar, böylece mantığı kod içinde yönetebiliriz.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|sounds).*)'],
};