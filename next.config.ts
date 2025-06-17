// next.config.js
/** @type {import('next').NextConfig} */
console.log(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/**`,
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/oyunlar',
        destination: '/projeler?type=oyun', // Veya sadece '/projeler' eğer type filtresi default olacaksa
        permanent: true,
      },
      {
        source: '/oyunlar/:slug',
        destination: '/projeler/:slug',
        permanent: true,
      },
      {
        source: '/animeler',
        destination: '/projeler?type=anime', // Veya sadece '/projeler'
        permanent: true,
      },
      {
        source: '/animeler/:slug',
        destination: '/projeler/:slug',
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;