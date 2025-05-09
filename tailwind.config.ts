// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}", 
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", 
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {
      // ... (mevcut extend ayarların) ...
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // <--- BURAYA EKLENDİ
    require('@tailwindcss/aspect-ratio'),
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/aspect-ratio'), // Eğer resim oranları için kullanacaksan bu da gerekebilir
  ], 
  darkMode: 'class', 
};
export default config;