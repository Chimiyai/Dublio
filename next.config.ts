// next.config.js (veya .mjs)
/** @type {import('next').NextConfig} */
console.log(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
const nextConfig = {
  // ...
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/**`,
      },
      // Eğer public klasöründeki placeholder'lar için Image component'ini
      // unoptimized={true} OLMADAN kullanmak isterseniz, localhost'u eklemeniz gerekebilir
      // AMA unoptimized={true} kullanmak daha basit bir çözüm.
    ],
  },
  // ...
};
module.exports = nextConfig;