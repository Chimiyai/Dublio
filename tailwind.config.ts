// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}", // Pages Router (varsa diye ekleyelim)
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", // Bileşenler
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // App Router
  ],
  theme: {
    extend: {
      // Buraya özel tema ayarları (renkler, fontlar vb.) eklenebilir
      // Örneğin:
      // backgroundImage: {
      //   "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      //   "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      // },
    },
  },
  plugins: [], // Tailwind eklentileri buraya eklenebilir
  darkMode: 'class', // Veya 'media' - Karanlık mod stratejisi
};
export default config;