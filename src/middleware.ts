// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  // API ve statik dosyalara her zaman izin ver
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // --- KULLANICI GİRİŞ YAPMIŞ MI? ---
  const isLoggedIn = !!token;
  
  // --- BAN DURUMUNU KONTROL ET ---
  const isBanned = token?.isBanned ?? false;
  const banExpires = token?.banExpiresAt ? new Date(token.banExpiresAt as string) : null;
  const isBanActive = isBanned && (!banExpires || banExpires > new Date());
  
  // --- KORUMALI SAYFALARI TANIMLA ---
  // Banlı bir kullanıcının GİREBİLECEĞİ sayfalar dışındaki her yer korunacak
  const bannedUserAllowedPaths = ['/', '/banlandiniz']; // Anasayfa ve ban sayfası
  const isAdminPage = pathname.startsWith('/admin');
  const isLoginPage = pathname.startsWith('/giris');
  const isProtectedRoute = !bannedUserAllowedPaths.includes(pathname) && !isAdminPage && !isLoginPage;

  // --- YENİ VE BASİT KURALLAR ---

  // 1. BANLI KULLANICI KONTROLÜ
  // Eğer kullanıcı banlıysa VE girmeye çalıştığı sayfa izin verilenler arasında DEĞİLSE
  if (isBanActive && !bannedUserAllowedPaths.includes(pathname)) {
    url.pathname = '/banlandiniz'; // Onu ban sayfasına yönlendir
    return NextResponse.redirect(url);
  }

  // 2. GİRİŞ YAPMAMIŞ KULLANICI KONTROLÜ
  // Eğer giriş yapmamışsa VE korumalı bir sayfaya girmeye çalışıyorsa
  if (!isLoggedIn && (isAdminPage || isProtectedRoute)) {
    url.pathname = '/giris';
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 3. ADMIN YETKİ KONTROLÜ
  // Eğer admin sayfasına girmeye çalışıyor ama rolü admin değilse
  if (isAdminPage && token?.role !== 'admin') {
    url.pathname = '/'; // Anasayfaya yönlendir
    return NextResponse.redirect(url);
  }

  // Hiçbir kurala takılmadıysa, isteğe izin ver
  return NextResponse.next();
}

// config objesi aynı kalabilir
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|sounds).*)'],
};