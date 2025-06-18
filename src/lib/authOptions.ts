// src/lib/authOptions.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password) return null;

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) return null;
        
        return { ...user, id: user.id.toString() };
      }
    })
  ],

  session: { strategy: 'jwt' },
  
  callbacks: {
    // SADECE GİRİŞ SIRASINDA ÇALIŞACAK ŞEKİLDE BASİTLEŞTİRİLDİ
    async jwt({ token, user }) {
      if (user) { // Bu blok sadece ilk girişte çalışır
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.isBanned = user.isBanned;
        token.banReason = user.banReason;
        token.banExpiresAt = user.banExpiresAt;
        token.profileImagePublicId = user.profileImagePublicId;
        token.bannerImagePublicId = user.bannerImagePublicId;
      }
      return token;
    },
    
    // Bu callback, token'daki veriyi session'a aktarır
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string | null;
        session.user.isBanned = token.isBanned as boolean;
        session.user.banReason = token.banReason as string | null;
        session.user.banExpiresAt = token.banExpiresAt as Date | string | null;
        session.user.profileImagePublicId = token.profileImagePublicId as string | null;
        session.user.bannerImagePublicId = token.bannerImagePublicId as string | null;
      }
      return session;
    },
  },
  
  pages: { 
    signIn: '/giris',
    error: '/giris',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
