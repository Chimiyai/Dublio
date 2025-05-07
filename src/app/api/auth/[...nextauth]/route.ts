// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User as NextAuthUser, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt'; // JWT tipini import ediyoruz
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; // Prisma Client'ımız
import bcrypt from 'bcrypt'; // Şifre karşılaştırma için

// NextAuth ayarlarını içeren nesne
export const authOptions: NextAuthOptions = {
  // Oturum yönetim stratejisi: JWT (JSON Web Token) kullanacağız
  // JWT, kullanıcı bilgilerini güvenli bir şekilde tarayıcıda saklamamızı sağlar.
  // 'database' stratejisi de vardır ama JWT genellikle daha esnektir.
  session: {
    strategy: 'jwt',
    // maxAge: 30 * 24 * 60 * 60, // Opsiyonel: Oturum süresi (örn: 30 gün)
  },

  // Kimlik doğrulama sağlayıcıları (providers)
  // Farklı giriş yöntemleri (Google, GitHub vb.) buraya eklenebilir.
  // Biz şimdilik sadece kendi veritabanımızla e-posta/şifre yöntemini kullanacağız.
  providers: [
    CredentialsProvider({
      // Bu sağlayıcının adı (isteğe bağlı)
      name: 'E-posta ve Şifre',
      // Giriş sayfasında (NextAuth'un otomatik oluşturduğu veya bizim oluşturacağımız)
      // hangi alanların isteneceğini belirtir. Biz kendi formumuzu yapacağımız
      // için burası doğrudan kullanılmayacak ama tanımlamak iyi bir pratiktir.
      credentials: {
        email: { label: "E-posta", type: "email", placeholder: "kullanici@example.com" },
        password: { label: "Şifre", type: "password" }
      },

      // Kullanıcıyı doğrulama (authorize) fonksiyonu.
      // Giriş denemesi yapıldığında NextAuth bu fonksiyonu çalıştırır.
      async authorize(credentials, req): Promise<NextAuthUser | null> {
        // credentials: Kullanıcının giriş formunda girdiği bilgiler (email, password)
        // req: Gelen istek hakkında bilgiler

        console.log('Authorize fonksiyonu çalıştı. Credentials:', credentials); // Geliştirme için log

        // Girdi kontrolü: E-posta ve şifre gelmiş mi?
        if (!credentials?.email || !credentials?.password) {
          console.error('Authorize: E-posta veya şifre eksik');
          // Hata fırlatmak yerine null döndürmek, NextAuth'a doğrulamayı reddetmesini söyler.
          // NextAuth bu durumu yakalayıp giriş sayfasına hata mesajıyla yönlendirir.
          // throw new Error('E-posta ve şifre gereklidir.'); // Veya hata fırlatılabilir
          return null;
        }

        try {
          // 1. Kullanıcıyı veritabanında e-posta ile bul (Prisma kullanarak)
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          // 2. Kullanıcı bulunamadıysa
          if (!user) {
            console.log(`Authorize: Kullanıcı bulunamadı - ${credentials.email}`);
            return null; // Doğrulama başarısız
          }

          console.log(`Authorize: Kullanıcı bulundu - ${user.email}. Şifre kontrol ediliyor...`);

          // 3. Şifreleri karşılaştır
          // bcrypt.compare, kullanıcının girdiği şifre ile veritabanındaki hash'lenmiş şifreyi karşılaştırır.
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          // 4. Şifre eşleşmiyorsa
          if (!passwordMatch) {
            console.log(`Authorize: Şifre eşleşmedi - ${user.email}`);
            return null; // Doğrulama başarısız
          }

          // 5. Doğrulama Başarılı!
          console.log(`Authorize: Başarılı giriş - ${user.email}`);
          // NextAuth'a kullanıcı bilgilerini döndür. Bu bilgiler JWT ve session'a eklenecek.
          // DİKKAT: ASLA ŞİFREYİ VEYA HASSAS BİLGİLERİ BURADA DÖNDÜRME!
          return {
            id: user.id.toString(), // NextAuth id'yi string bekler
            email: user.email,
            name: user.username, // 'name' alanı NextAuth tarafından kullanılır, username'i atayalım
            role: user.role      // Rol bilgisini de ekleyelim
            // plan: user.plan // Eğer plan sistemi olsaydı...
          } as NextAuthUser; // Döndürdüğümüz nesnenin NextAuthUser tipinde olduğunu belirtiyoruz

        } catch (error) {
          console.error('Authorize: Veritabanı veya bcrypt hatası:', error);
          return null; // Herhangi bir hata durumunda doğrulamayı reddet
        }
      }
    })
  ],

  // Özel sayfalar (isteğe bağlı)
  // NextAuth'un varsayılan sayfaları yerine kendi sayfalarımızı kullanmak için.
  pages: {
    signIn: '/giris',    // Giriş sayfamızın yolu (bir sonraki adımda oluşturacağız)
    // signOut: '/auth/cikis', // Özel çıkış sayfası (gerekirse)
    // error: '/auth/hata',   // Kimlik doğrulama hataları için özel sayfa
    // verifyRequest: '/auth/dogrulama-iste', // E-posta doğrulama için
    // newUser: '/kayit' // Yeni kullanıcı kaydı için (Credentials ile pek kullanılmaz)
  },

  // Callback'ler: Belirli olaylar gerçekleştiğinde özel işlemler yapmak için.
  callbacks: {
    // JWT (JSON Web Token) oluşturulduğunda veya güncellendiğinde çalışır.
    // Token içinde saklanacak bilgileri burada belirleriz.
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // `user` nesnesi SADECE İLK GİRİŞTE (`authorize` başarılı olduğunda) gelir.
      // İlk girişte `authorize`dan dönen bilgileri token'a ekleyelim.
      if (user) {
        console.log('JWT Callback: İlk giriş, user:', user);
        token.id = user.id;
        token.role = user.role; // Rol bilgisini token'a ekle
        // token.name ve token.email NextAuth tarafından zaten eklenir (eğer user'da varsa)
      }

      // Eğer oturum güncellenirse (örneğin Client'tan `useSession().update()`)
      // ve session içinde yeni rol bilgisi varsa, token'daki rolü de güncelle.
      // Bu, admin panelinde rol değiştirildiğinde işe yarayabilir.
      if (trigger === "update" && session?.role) {
        console.log('JWT Callback: Oturum güncelleme, yeni rol:', session.role);
        token.role = session.role;
      }

      // console.log('JWT Callback: Oluşturulan/Güncellenen Token:', token);
      return token; // Güncellenmiş token'ı döndür
    },

    // Oturum (session) bilgisi istendiğinde (örneğin `useSession` hook'u ile) çalışır.
    // Tarayıcıya gönderilecek session nesnesine hangi bilgilerin ekleneceğini belirleriz.
    async session({ session, token }): Promise<Session> {
      // Token içinde sakladığımız ekstra bilgileri (id, role) session nesnesine aktaralım.
      // Bu sayede Client Component'lerde `useSession` ile bu bilgilere erişebiliriz.
      if (token) {
        // session.user normalde sadece name, email, image içerir. Biz genişletiyoruz.
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      // console.log('Session Callback: Oluşturulan Oturum:', session);
      return session; // Güncellenmiş session nesnesini döndür
    }
  },

  // Gizli Anahtar (Secret)
  // JWT'leri imzalamak ve doğrulamak için kullanılır. Güvenlik için çok önemlidir.
  // Bu değeri ASLA doğrudan koda yazma, Environment Variable'dan al.
  // Terminalde 'openssl rand -base64 32' komutuyla güçlü bir secret üretebilirsin.
  secret: process.env.NEXTAUTH_SECRET,

  // Hata ayıklama (isteğe bağlı)
  // Geliştirme sırasında NextAuth'un daha fazla log üretmesini sağlar.
  // debug: process.env.NODE_ENV === 'development',
};

// NextAuth handler'ını oluştur ve GET/POST istekleri için export et
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };