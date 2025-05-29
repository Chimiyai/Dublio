// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username?: string | null;
      profileImagePublicId?: string | null;
      bannerImagePublicId?: string | null;
      // DefaultSession["user"]'dan gelenleri de ekleyelim ki name, email, image da olsun
    } & DefaultSession["user"]; 
  }

  // Bu User tipi, authorize'dan dönen ve jwt callback'ine gelen user objesi için
  interface User extends DefaultUser {
    id: string; // authorize'da toString() yaptığımız için string
    role: string;
    username?: string | null; // 'name' alanı yerine bunu kullanıyoruz
    profileImagePublicId?: string | null;
    bannerImagePublicId?: string | null;
    // 'name', 'email', 'image' DefaultUser'dan gelir.
    // authorize'dan dönerken 'name' alanına username'i atamıştık.
  }
}

declare module "next-auth/jwt" {
  // Token'a eklediğimiz alanlar
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    username?: string | null;
    profileImagePublicId?: string | null;
    bannerImagePublicId?: string | null;
    // 'name', 'email', 'picture' (DefaultJWT'den gelen image) JWT'de olabilir
  }
}