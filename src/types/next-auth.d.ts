// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// JWT interface'ini genişletiyoruz
// Token'ımıza eklediğimiz özel alanları (id, role) buraya ekliyoruz
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    // Başka özel alanlar eklersek buraya da ekleyeceğiz
  }
}

// Session interface'ini genişletiyoruz
// Session.user nesnesine eklediğimiz özel alanları buraya ekliyoruz
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      // Varsayılan Session user tiplerini de korumak için ...DefaultSession["user"] kullanıyoruz
    } & DefaultSession["user"]; // name, email, image alanlarını korur
  }

  // User interface'ini (authorize fonksiyonundan dönen) genişletiyoruz
  // Bu, authorize fonksiyonunda role döndürdüğümüzde hata almamızı engeller
  // ve JWT callback'indeki 'user' parametresine tip ekler.
  interface User extends DefaultUser {
     role: string;
     // id zaten DefaultUser içinde string olarak var, email ve name de öyle.
  }
}