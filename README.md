# Prestij Dublaj Sitesi

Türkiye'deki oyun ve anime projelerine topluluk odaklı dublaj desteği sunan, kullanıcıların projeleri keşfedip etkileşime geçebildiği, sanatçılarla iletişim kurabildiği modern bir web platformu.

## Özellikler

- **Projeler:** Oyun ve anime projelerini listeleme, detay sayfası, beğeni, favori, yorum ve istatistikler.
- **Sanatçılar:** Dublaj sanatçısı profilleri, katkıda bulundukları projeler.
- **Kullanıcı Profili:** Kütüphane, favoriler, profil düzenleme, e-posta doğrulama.
- **Mesajlaşma:** Gerçek zamanlı kullanıcılar arası sohbet.
- **Arama:** Gelişmiş arama ve filtreleme, kategoriye göre listeleme.
- **Yönetim Paneli:** Adminler için proje, sanatçı, kategori ve kullanıcı yönetimi.
- **Modern Arayüz:** Responsive ve hızlı, Tailwind CSS ile tasarlanmış.
- **Cloudinary:** Görsel optimizasyonu ve hızlı yükleme.
- **Next.js App Router:** Modern, sunucu tarafı ve istemci tarafı bileşen desteği.

## Klasör Yapısı

```
src/
  app/
    (auth)/         # Giriş, kayıt, şifre işlemleri
    admin/          # Yönetici paneli ve alt sayfalar
    api/            # REST API endpoint'leri
    mesajlar/       # Mesajlaşma sayfaları ve layout
    profil/         # Kullanıcı profili ve ayarları
    projeler/       # Proje listeleme ve detay sayfaları
    sanatcilar/     # Sanatçı profilleri
    ...             # Diğer sayfalar (hakkımızda, gizlilik, vb.)
  components/
    layout/         # Header, Footer, SearchOverlay, vb.
    home/           # Ana sayfa bölümleri
    messages/       # Mesajlaşma arayüzü
    profile/        # Profil bileşenleri
    project/        # Proje detay bileşenleri
    projects/       # Proje grid ve kartları
    ui/             # Genel arayüz bileşenleri (button, card, vs.)
    admin/          # Admin panel bileşenleri
    artists/        # Sanatçı kartları ve avatarları
    ...             # Diğer yardımcı bileşenler
  data/             # Sabit veri dosyaları
  lib/              # Yardımcı fonksiyonlar, Cloudinary, utils, auth
  types/            # TypeScript tip tanımları
  globals.css       # Global stiller (Tailwind)
```

## Kurulum

1. **Projeyi klonla:**
   ```bash
   git clone https://github.com/kullaniciadi/prestij-dublaj-sitesi.git
   cd prestij-dublaj-sitesi
   ```

2. **Bağımlılıkları yükle:**
   ```bash
   npm install
   # veya
   yarn install
   ```

3. **Çevresel değişkenleri ayarla:**
   - `.env.local` dosyasını oluştur.
   - Veritabanı, Cloudinary, e-posta ve diğer API anahtarlarını gir.

4. **Geliştirme sunucusunu başlat:**
   ```bash
   npm run dev
   # veya
   yarn dev
   ```

5. **Projeyi aç:**
   ```
   http://localhost:3000
   ```

## Kullanılan Teknolojiler

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudinary](https://cloudinary.com/) (görsel yönetimi)
- [Prisma](https://www.prisma.io/) (ORM)
- [SWR](https://swr.vercel.app/) (veri çekme)
- [NextAuth.js](https://next-auth.js.org/) (kimlik doğrulama)
- [PostgreSQL](https://www.postgresql.org/) (veya başka bir veritabanı)
- [Vercel](https://vercel.com/) (deploy için önerilir)

## Katkı Sağlama

1. Fork'la ve yeni bir branch oluştur.
2. Değişikliklerini yap ve commit et.
3. Pull request gönder.

## Lisans

MIT

---

> Bu proje Prestij Studio topluluğu için geliştirilmiştir.