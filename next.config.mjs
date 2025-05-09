// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '', // port boş kalabilir veya tanımlanmayabilir
        // pathname önemlidir, cloud adınızı içermeli
        pathname: '/dharbtpfn/image/upload/**', 
        // SENİN CLOUD ADINLA DEĞİŞTİR, örn: '/dharbtpfn/image/upload/**'
      },
      // Diğer domainler...
    ],
  },
};

export default nextConfig;