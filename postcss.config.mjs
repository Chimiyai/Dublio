// postcss.config.mjs
/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: {
      // Eski: tailwindcss: {},
      // Yeni: '@tailwindcss/postcss': {}, // Yeni paketin adını kullanıyoruz
      // Veya daha modern ve önerilen kullanım:
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  };
  
  export default config;