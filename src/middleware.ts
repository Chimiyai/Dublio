// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // NextAuth API rotalarını her zaman geç
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Korumalı admin rotaları
  if (pathname.startsWith('/admin')) {
    console.log("[Middleware ÇALIŞIYOR] Path:", pathname);
    console.log("[Middleware] Token:", token ? `ID: ${token.sub}, Rol: ${token.role}` : "Token yok");
    console.log("[Middleware] /admin yolu tespit edildi.");
    if (!token || token.role !== 'admin') {
      console.log(`[Middleware] /admin için ROL YANLIŞ (${token?.role || 'yok'}). Ana sayfaya yönlendiriliyor.`);
      const url = req.nextUrl.clone();
      url.pathname = '/'; // Ana sayfaya yönlendir
      return NextResponse.redirect(url);
    }
    console.log("[Middleware] Admin erişimi onaylandı:", pathname);
    return NextResponse.next(); // Admin ise devam et
  }

  // --- YENİ: Korumalı profil rotası ---
  if (pathname.startsWith('/profil')) {
      // Eğer token yoksa (giriş yapılmamışsa) giriş sayfasına yönlendir
      if (!token) {
          console.log(`[Middleware] /profil için GİRİŞ YAPILMAMIŞ. Giriş sayfasına yönlendiriliyor.`);
          const url = req.nextUrl.clone();
          // callbackUrl ekleyerek giriş sonrası profile yönlendirebiliriz
          url.pathname = '/giris'; 
          url.searchParams.set('callbackUrl', pathname); // Giriş sonrası buraya dön
          return NextResponse.redirect(url);
      }
      // Giriş yapılmışsa devam et (herhangi bir rol olabilir)
       console.log(`[Middleware] /profil erişimi onaylandı: ${token.name}`);
      return NextResponse.next();
  }
  // ---------------------------------
// --- YENİ: Korumalı mesajlar rotası ---
if (pathname.startsWith('/mesajlar')) {
  if (!token) {
      console.log(`[Middleware] /mesajlar için GİRİŞ YAPILMAMIŞ. Giriş sayfasına yönlendiriliyor.`);
      const url = req.nextUrl.clone();
      url.pathname = '/giris'; 
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
  }
   console.log(`[Middleware] /mesajlar erişimi onaylandı: ${token.name}`);
  return NextResponse.next();
}
// ---------------------------------
return NextResponse.next();
}

// Middleware'in hangi yollarda çalışacağını belirtir
export const config = {
  matcher: [
    '/admin/:path*', // Admin sayfaları
    '/profil/:path*', // Profil sayfaları (YENİ)
    '/mesajlar/:path*', // Mesaj sayfaları (YENİ)
  ],
}