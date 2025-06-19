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
        
        // ÖNEMLİ: Prisma'dan dönen id number, string'e çeviriliyor.
        return { ...user, id: user.id.toString() };
      }
    })
  ],

  session: { strategy: 'jwt' },
  
  callbacks: {
    // --- GÜNCELLENMİŞ JWT CALLBACK ---
    async jwt({ token, user, trigger, session }) {
      // 1. İlk Giriş Anı: Kullanıcı ilk kez giriş yaptığında `user` objesi dolu gelir.
      if (user) {
        console.log("JWT Callback: User signing in for the first time or creating new session.");
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.isBanned = user.isBanned;
        token.banReason = user.banReason;
        token.banExpiresAt = user.banExpiresAt;
        token.profileImagePublicId = user.profileImagePublicId;
        token.bannerImagePublicId = user.bannerImagePublicId;
        // İlk kontrol zamanını ayarlayalım
        token.lastChecked = Math.floor(Date.now() / 1000);
        return token;
      }

      // 2. Session Güncelleme Tetiklendiğinde: Client tarafında `useSession().update()` çağrıldığında çalışır.
      // Bu, örneğin profil resmi güncellendiğinde veya admin panelinden bir kullanıcının ban durumu değiştirildiğinde
      // anında yansıtmak için kullanılabilir.
      if (trigger === "update" && session) {
        console.log("JWT Callback: Session update triggered.");
        // Gelen yeni session bilgisiyle token'ı güncelle
        return { ...token, ...session.user };
      }

      // 3. Her Sonraki İstekte Token'ın Tazeliğini Kontrol Etme (Periyodik Güncelleme)
      const now = Math.floor(Date.now() / 1000); // Saniye cinsinden şimdiki zaman
      const lastChecked = (token.lastChecked as number) || 0;
      const checkInterval = 5 * 60; // 5 dakika (saniye cinsinden)

      // Son kontrolden bu yana 5 dakikadan fazla geçtiyse, veritabanından son durumu çek.
      // Bu, kullanıcının ban durumu gibi kritik bilgilerin güncel kalmasını sağlar.
      if (now > lastChecked + checkInterval) {
        console.log("JWT Callback: Re-fetching user data from DB for token refresh.");
        const dbUser = await prisma.user.findUnique({
          where: { id: Number(token.id) }, // ID'niz integer olduğu için Number() kullandık
        });

        if (dbUser) {
          // Token'ı en güncel veritabanı bilgileriyle güncelle
          token.role = dbUser.role;
          token.isBanned = dbUser.isBanned;
          token.banReason = dbUser.banReason;
          token.banExpiresAt = dbUser.banExpiresAt;
          // Diğer önemli alanları da burada güncelleyebilirsiniz
          
          // Son kontrol zamanını güncelle
          token.lastChecked = now;
        } else {
          // Eğer kullanıcı veritabanında bulunamazsa (silinmişse), token'ı geçersiz kıl.
          // Bu, kullanıcının oturumunu sonlandırır.
          return null;
        }
      }

      return token;
    },
    
    // --- GÜNCELLENMİŞ SESSION CALLBACK ---
    async session({ session, token }) {
      // Token'dan gelen tüm güncel bilgileri session objesine aktar.
      // Bu, client tarafında `useSession()` ile erişilen veriyi oluşturur.
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string | null;
        session.user.isBanned = token.isBanned as boolean;
        session.user.banReason = token.banReason as string | null;
        // Tarih formatının string veya Date olabileceğini belirtelim
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