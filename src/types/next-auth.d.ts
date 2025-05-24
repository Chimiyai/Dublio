// src/types/next-auth.d.ts (veya projenizdeki uygun yol)
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string | null; // Veya User modelinizdeki role tipine göre
    } & DefaultSession["user"]; // name, email, image gibi varsayılanları koru
  }

  // NextAuth User tipi, authorize'dan dönenle ve callbacks.jwt içindeki user ile eşleşmeli
  interface User extends DefaultUser {
    role?: string | null; // User modelinizdeki rolle eşleşmeli
    // Eğer authorize'dan başka özel alanlar döndürüyorsanız, buraya da ekleyin
  }
}

declare module "next-auth/jwt" {
  // JWT token'ına eklediğimiz özel alanlar
  interface JWT extends DefaultJWT {
    id: string;
    role?: string | null;
  }
}