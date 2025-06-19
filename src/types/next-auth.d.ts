// types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';

// Session ve User tiplerini genişletme
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // id'yi string olarak kullanıyoruz
      role: string;
      username: string | null;
      isBanned: boolean;
      banReason: string | null;
      banExpiresAt: Date | string | null; // Hem Date hem string olabileceğini belirtelim
      profileImagePublicId: string | null;
      bannerImagePublicId: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    // Prisma'dan authorize fonksiyonuna dönen user objesiyle eşleşmeli
    id: string; // authorize içinde string'e çeviriyoruz
    role: string;
    username: string;
    isBanned: boolean;
    banReason: string | null;
    banExpiresAt: Date | null;
    profileImagePublicId: string | null;
    bannerImagePublicId: string | null;
  }
}

// JWT tipini genişletme
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    username: string | null;
    isBanned: boolean;
    banReason: string | null;
    banExpiresAt: Date | string | null;
    profileImagePublicId: string | null;
    bannerImagePublicId: string | null;
    lastChecked?: number; // Periyodik kontrol için son kontrol zamanı (timestamp)
  }
}