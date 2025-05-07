// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true, // Genellikle varsayılan ve iyi bir pratiktir
    // experimental: { // serverActions Next.js 14+ ile stabildir, experimental altında olmayabilir
    //   serverActions: true, // Eğer Server Action kullanacaksak (ileride gerekebilir)
    // },
    // logging: { // Bu logging ayarı doğrudan NextConfig tipinde olmayabilir,
    //   level: 'debug' // Next.js 13.4+ ile debug için farklı yöntemler var
    // }
    // Şimdilik bu dosyayı çok basit tutalım, middleware için özel bir ayar gerekmiyor olmalı
  };
  
  export default nextConfig;