// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT, JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username?: string | null;
      profileImagePublicId?: string | null; // Bu alan eksikti
      bannerImagePublicId?: string | null;  // Bu alan eksikti
      isBanned: boolean;
      banReason?: string | null;
      banExpiresAt?: Date | string | null;
    } & DefaultSession["user"]; 
  }

  interface User extends DefaultUser {
    id: number | string; // authorize'dan hem number hem string gelebilir
    role: string;
    username?: string | null;
    profileImagePublicId?: string | null; // Bu alan eksikti
    bannerImagePublicId?: string | null;  // Bu alan eksikti
    isBanned: boolean;
    banReason?: string | null;
    banExpiresAt?: Date | null;
    password?: string | null; // Prisma'dan gelebilir
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string | number;
    role?: string;
    username?: string | null;
    profileImagePublicId?: string | null; // Bu alan eksikti
    bannerImagePublicId?: string | null;  // Bu alan eksikti
    isBanned?: boolean;
    banReason?: string | null;
    banExpiresAt?: Date | string | null;
  }
}