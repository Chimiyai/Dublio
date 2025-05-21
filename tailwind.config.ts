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
      colors: {
        'bg-primary-dark': '#0C0E0F',    // Koyu arka plan rengi
        'text-brand-purple': '#8B4EFF',    // Vurgu/aksan rengi (mor)
        'secondary-dark': '#100C1C',   // İkincil koyu renk
      },
      textShadow: {
        sm: '1px 1px 2px rgba(0,0,0,0.5)',
        DEFAULT: '2px 2px 4px rgba(0,0,0,0.5)',
        md: '2px 2px 8px rgba(0,0,0,0.3)',
        lg: '3px 3px 10px rgba(0,0,0,0.5)',
      },
      boxShadow: { // Özel gölge efektleri için
        'lg-purple': '0 4px 15px rgba(139, 78, 255, 0.3)',
        'lg-purple-intense': '0 0 0 2.5px #8B4EFF, 0 8px 25px rgba(139, 78, 255, 0.4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // <--- BURAYA EKLENDİ
    require('@tailwindcss/aspect-ratio'),
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/aspect-ratio'), // Eğer resim oranları için kullanacaksan bu da gerekebilir
    require('tailwindcss-textshadow') // Eğer bu plugini kullanıyorsan: npm install -D tailwindcss-textshadow
  ], 
  darkMode: 'class', 
};
export default config;