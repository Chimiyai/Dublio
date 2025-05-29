// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User as NextAuthUserFromLib, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Bu tip, authorize fonksiyonundan dönecek ve jwt callback'ine user olarak gelecek objenin tipidir.
// next-auth.d.ts'deki User interface'inizle uyumlu olmalı.
type AuthorizeReturnType = {
  id: string;
  name?: string | null; // NextAuth'un beklediği 'name' alanı
  email?: string | null;
  image?: string | null; // NextAuth'un beklediği 'image' alanı
  // Kendi özel alanlarınız
  role: string;
  username?: string | null;
  profileImagePublicId?: string | null;
  bannerImagePublicId?: string | null;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'E-posta ve Şifre',
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials, req): Promise<AuthorizeReturnType | null> {
        console.log('[AUTH] Authorize function started. Credentials:', credentials ? { email: credentials.email, passLength: credentials.password?.length } : null);

        if (!credentials?.email || !credentials?.password) {
          console.error('[AUTH] Authorize: Email or password missing.');
          return null;
        }

        try {
          const userFromDb = await prisma.user.findUnique({
            where: { email: credentials.email },
            // Gerekli tüm alanları seçtiğimizden emin olalım
            select: { 
                id: true, 
                email: true, 
                username: true, 
                password: true, 
                role: true, 
                profileImagePublicId: true, 
                bannerImagePublicId: true 
            }
          });

          if (!userFromDb) {
            console.log(`[AUTH] Authorize: User not found with email: ${credentials.email}`);
            return null;
          }
          console.log(`[AUTH] Authorize: User found in DB: ${userFromDb.email}`);
          console.log("[AUTH] Authorize - Raw User from DB:", JSON.stringify(userFromDb, null, 2));


          const passwordMatch = await bcrypt.compare(credentials.password, userFromDb.password);

          if (!passwordMatch) {
            console.log(`[AUTH] Authorize: Password mismatch for user: ${userFromDb.email}`);
            return null;
          }

          console.log(`[AUTH] Authorize: Login successful for: ${userFromDb.email}`);
          const userToReturn: AuthorizeReturnType = {
            id: userFromDb.id.toString(),
            name: userFromDb.username, // 'name' prop'una username atıyoruz
            email: userFromDb.email,
            image: null, // veya userFromDb.profileImagePublicId ile bir URL oluşturabilirsiniz ama client'ta yapacağız
            role: userFromDb.role,
            username: userFromDb.username,
            profileImagePublicId: userFromDb.profileImagePublicId,
            bannerImagePublicId: userFromDb.bannerImagePublicId,
          };
          console.log("[AUTH] Authorize - User object being returned:", JSON.stringify(userToReturn, null, 2));
          return userToReturn;

        } catch (error) {
          console.error('[AUTH] Authorize: Database or bcrypt error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/giris',
  },
  callbacks: {
    async jwt({ token, user, trigger, session: newSessionData }) { // 'user' parametresi AuthorizeReturnType tipinde olacak
      console.log("[AUTH] JWT Callback - Trigger:", trigger);
      if (user) { // Bu blok sadece ilk girişte (sign-in) veya OAuth ile user objesi varsa çalışır
        const u = user as AuthorizeReturnType; // Gelen user'ı kendi tipimize cast edelim
        console.log("[AUTH] JWT Callback - User object received (on sign-in/account link):", JSON.stringify(u, null, 2));
        
        token.uid = u.id; // NextAuth v4'te id yerine sub kullanılırdı, v5'te id daha yaygın. uid de olabilir.
                          // next-auth.d.ts'deki JWT tipinde 'id' veya 'uid' olmalı. 'id' kullanalım.
        token.id = u.id; 
        token.role = u.role;
        token.username = u.username;
        token.profileImagePublicId = u.profileImagePublicId;
        token.bannerImagePublicId = u.bannerImagePublicId;
        
        // DefaultJWT'den gelen alanları da dolduralım (eğer DefaultUser'dan name, email, image geliyorsa)
        token.name = u.name; 
        token.email = u.email;
        token.picture = u.image; // Bu genellikle avatar için kullanılır, biz kendi ID'lerimizi kullanıyoruz
      }

      // Session update trigger'ı (client'tan useSession().update() çağrıldığında)
      if (trigger === "update" && newSessionData?.user) {
        const updatedSessionUser = newSessionData.user as Session['user']; // Session tipindeki user
        
        console.log("[AUTH] JWT Callback - Updating token due to session update trigger. New data:", updatedSessionUser);
        
        if (updatedSessionUser.username !== undefined) token.username = updatedSessionUser.username;
        if (updatedSessionUser.name !== undefined) token.name = updatedSessionUser.name;
        if (updatedSessionUser.profileImagePublicId !== undefined) token.profileImagePublicId = updatedSessionUser.profileImagePublicId;
        if (updatedSessionUser.bannerImagePublicId !== undefined) token.bannerImagePublicId = updatedSessionUser.bannerImagePublicId;
        // Diğer güncellenebilecek alanlar
      }
      console.log("[AUTH] JWT Callback - Token being returned:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) { // token objesi JWT tipinde (bizim genişlettiğimiz)
      console.log("[AUTH] Session Callback - Received token to build session:", JSON.stringify(token, null, 2));
      if (token && session.user) {
        // session.user objesini next-auth.d.ts'deki Session['user'] tipine göre doldur
        session.user.id = token.id as string; // JWT'deki id'yi kullan
        session.user.role = token.role as string;
        session.user.username = token.username as string | null | undefined;
        session.user.name = token.name as string | null | undefined; 
        session.user.email = token.email as string | null | undefined; 
        // session.user.image = token.picture as string | null | undefined; // Varsayılan image için

        session.user.profileImagePublicId = token.profileImagePublicId as string | null | undefined;
        session.user.bannerImagePublicId = token.bannerImagePublicId as string | null | undefined;
      }
      console.log("[AUTH] Session Callback - Session object being returned:", JSON.stringify(session, null, 2));
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Geliştirme modunda debug loglarını aç
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };