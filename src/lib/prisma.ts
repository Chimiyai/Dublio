// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// TypeScript için global bir tip tanımı yapıyoruz.
// Bu, geliştirme sırasında hot-reloading nedeniyle oluşabilecek
// 'prisma' değişkeninin tekrar tekrar tanımlanmasını engellemek için
// global namespace'i kullanmamızı sağlar.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Global alanda 'prisma' adında bir değişken var mı diye kontrol ediyoruz.
// Varsa onu kullanıyoruz, yoksa yeni bir PrismaClient örneği oluşturuyoruz.
// PrismaClient, veritabanı ile etkileşim kuran ana nesnedir.
const prisma = global.prisma || new PrismaClient({
    // Opsiyonel: Çalıştırılan tüm veritabanı sorgularını konsolda görmek istersen
    // aşağıdaki satırın yorumunu kaldırabilirsin. Geliştirme sırasında faydalı olabilir.
    // log: ['query', 'info', 'warn', 'error'],
});

// Eğer production (canlı) ortamında değilsek (yani geliştirme ortamındaysak),
// oluşturduğumuz veya mevcut olan 'prisma' örneğini global alana kaydediyoruz.
// Böylece bir sonraki hot-reload'da bu örnek tekrar kullanılır.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Oluşturulan veya mevcut olan PrismaClient örneğini dışa aktarıyoruz.
// Artık projemizin herhangi bir yerinden 'import prisma from "@/lib/prisma";'
// yaparak bu örneğe erişip veritabanı işlemleri yapabiliriz.
export default prisma;