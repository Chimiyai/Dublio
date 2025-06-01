//src/lib/authOptions.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; // Prisma client'ınızın yolu
import bcrypt from 'bcrypt'; // Şifre karşılaştırma için

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('E-posta ve şifre gerekli.');
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Kullanıcı bulunamadı veya şifre tanımlanmamış.');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error('Geçersiz şifre.');
        }

        // authorize fonksiyonundan dönen user objesi, jwt ve session callback'lerine gider.
        // next-auth.d.ts'deki User tipine uygun olmalı.
        return {
          id: user.id.toString(), // ID string olmalı
          email: user.email,
          username: user.username,
          role: user.role,
          profileImagePublicId: user.profileImagePublicId,
          bannerImagePublicId: user.bannerImagePublicId,
          // name ve image alanları NextAuth tarafından beklenir,
          // username'i name'e, profil resmini image'a atayabiliriz.
          name: user.username,
          image: user.profileImagePublicId, // Veya tam Cloudinary URL'i
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // User objesinden gelen bilgileri token'a ekle
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.profileImagePublicId = user.profileImagePublicId;
        token.bannerImagePublicId = user.bannerImagePublicId;
        // token.picture = user.image; // Zaten DefaultJWT'de var
        // token.name = user.name; // Zaten DefaultJWT'de var
      }
      return token;
    },
    async session({ session, token }) {
      // Token'dan gelen bilgileri session.user'a ekle
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string | null | undefined;
        session.user.profileImagePublicId = token.profileImagePublicId as string | null | undefined;
        session.user.bannerImagePublicId = token.bannerImagePublicId as string | null | undefined;
        // session.user.name = token.name; // Zaten DefaultSession'da var
        // session.user.image = token.picture; // Zaten DefaultSession'da var
      }
      return session;
    },
  },
  pages: {
    signIn: '/giris', // Özel giriş sayfanızın yolu
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (e.g. check your email)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  },
  secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development', // Geliştirme sırasında debug logları için
};