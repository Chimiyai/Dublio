// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary domain'i
      },
      // Daha önce eklediğiniz başka domain'ler varsa burada kalabilir
      // Örnek:
      // {
      //   protocol: 'https',
      //   hostname: 'tr.visafoto.com',
      // },
    ],
  },
  // Mevcut diğer ayarlarınız buraya gelebilir
  // reactStrictMode: true, 
};

export default nextConfig;