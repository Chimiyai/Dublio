import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware ÇALIŞIYOR] Path: ${pathname}`);

  if (pathname.startsWith('/api/auth')) {
    console.log('[Middleware] NextAuth API yolu, devam ediliyor.');
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  console.log('[Middleware] Token:', token ? `ID: ${token.id}, Rol: ${token.role}` : 'YOK');

  if (pathname.startsWith('/admin')) {
    console.log('[Middleware] /admin yolu tespit edildi.');
    if (!token) {
      console.warn(`[Middleware] /admin için TOKEN YOK. /giris adresine yönlendiriliyor.`);
      const loginUrl = new URL('/giris', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    } else if (token.role !== 'admin') { // <<<--- BU BLOK ÖNEMLİ
      console.warn(`[Middleware] /admin için ROL YANLIŞ (${token.role}). Ana sayfaya yönlendiriliyor.`);
      const unauthorizedUrl = new URL('/', request.url); // Ana sayfaya yönlendir
      return NextResponse.redirect(unauthorizedUrl); // <<<--- ANA SAYFAYA YÖNLENDİRME
    }
    console.log(`[Middleware] Admin erişimi onaylandı: ${pathname}`);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};