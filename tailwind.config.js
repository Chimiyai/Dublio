// tailwind.config.js (KAPSAMLI HALİ)

const { MailWarningIcon } = require('lucide-react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // Eğer pages dizininiz varsa: "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: { // Header'da container kullanacağız
      center: true,
      padding: {
        DEFAULT: '1rem', // 20px (veya header için 25px ise 1.5rem / px-[25px])
        sm: '1.5rem',    // 24px
        // lg: '2rem',
      },
      screens: { // Orijinal CSS'deki max-width: 1250px
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1250px',
        '2xl': '1250px',
      },
    },
    extend: {
      colors: {
        'prestij-purple': '#8B4EFF',
        'prestij-purple-light': '#A47EFF',
        'prestij-purple-darker': '#7A3EFF',
        'prestij-bg-dark-1': '#0C0E0F',     // Ana Header BG, Footer BG
        'prestij-bg-dark-2': '#101014',     // Ana Sayfa Body BG
        'prestij-bg-dark-3': '#1A1A1D',     // Arama kutusu, Header dropdown BG
        'prestij-bg-dark-4': '#202024',     // Arama kutusu focus BG
        'prestij-bg-button': '#231B36',     // Login/Download buton BG

        'prestij-text-primary': '#E0E0E0',    // Site adı, önemli başlıklar
        'prestij-text-secondary': '#D1D1D1',  // Buton yazıları
        'prestij-text-accent': '#B0B0B0',     // Nav linkleri, bildirim ikonu
        'prestij-text-dropdown': '#C0C0C0',   // Dropdown linkleri, arama input yazısı
        'prestij-text-placeholder': '#777777',// Input placeholder
        'prestij-text-muted': '#888888',      // Dropdown title'ları için (hafif soluk)
        'prestij-text-link-special': '#5c5c5c', // Dropdown "Oyun ekle" linki

        'prestij-border-primary': '#1f1f23',  // Header alt çizgisi, mobil panel çizgileri
        'prestij-border-input-focus': '#8B4EFF', // Arama kutusu focus border
        // Hero Section için Yeni Renkler
        'hero-bg': '#08060D', // .hero-section background
        'hero-top-card-bg': '#100C1C', // .top-project-item background
        'hero-top-card-banner-bg': '#050308', // .top-project-banner background
        'hero-top-card-text': '#E8E6F0', // .top-project-item .project-title
        'hero-top-card-date-text': '#B0A8CC', // .top-project-item .project-date
        'hero-main-showcase-bg': '#050308', // .hero-main-showcase background
        'hero-info-category-bg': 'rgba(139, 78, 255, 0.8)', // .info-category background
        'hero-btn-play-bg-hover': '#7A3EFF', // .btn-play-now:hover
        'hero-btn-details-bg': 'rgba(255,255,255,0.15)',
        'hero-btn-details-bg-hover': 'rgba(255,255,255,0.25)',
        'hero-btn-details-border': 'rgba(255,255,255,0.2)',
        'hero-side-list-item-bg': '#100C1C', // .side-list-item-link background
        'hero-side-list-item-bg-hover': '#140F22',
        'hero-side-list-item-active-bg': '#181428',
        'hero-side-list-item-text': '#D0C9E8',
        // Tür etiketleri için (orijinal CSS'den)
        'project-type-oyun': '#2A9D8F',
        'project-type-anime': '#E76F51',
        'slider-card-bg': '#100C1C', // .slider-card background (hero-top-card-bg ile aynı görünüyor)
        'slider-card-title': '#FFFFFF', // .slider-card-title
        'slider-card-description': '#B0B8C8', // .slider-card-description
        'slider-card-type-oyun': '#2A9D8F', // .project-type-oyun (zaten var)
        'slider-card-type-anime': '#E76F51', // .project-type-anime (zaten var)
        'slider-btn-dub-request-bg': '#231B36', // .btn-dub-request background (prestij-bg-button ile aynı)
        'slider-btn-dub-request-border': '#28282C', // .btn-dub-request border (prestij-border-secondary ile aynı)
        'slider-meta-info-text': '#A0A0B0', // .meta-info text (prestij-text-muted ile benzer)
        'popular-section-bg': '#08060D', // .popular-content-section background (hero-bg ile aynı)
        'popular-card-bg': '#130F1E',    // .popular-card-link background
        'popular-card-border-top': '#1E1A2A', // .popular-card-stats border-top
        'popular-card-text': '#E8E8F0', // .popular-card-title
        'popular-card-description-text': '#9898A8',
        'popular-card-date-text': '#707080',
        'popular-stat-button-text': '#808090',
        'popular-stat-button-hover-text': '#8B4EFF',
        'popular-stat-button-hover-bg': 'rgba(139, 78, 255, 0.1)',
           
        'filter-btn-text': '#A0A0B8',
        'filter-btn-border': '#30283D',
        'filter-btn-hover-text': '#8B4EFF',
        'filter-btn-hover-bg': 'rgba(139, 78, 255, 0.1)',
        'filter-btn-hover-border': '#8B4EFF',
        'filter-btn-active-bg': '#8B4EFF',
        'filter-btn-active-text': '#FFFFFF',
        'filter-btn-active-border': '#8B4EFF',
           
        'dropdown-ctrl-bg': '#130F1E', // .dropdown-control-toggle background
        'dropdown-ctrl-text': '#B0B0B8',
        'dropdown-ctrl-border': '#282338',
        'dropdown-ctrl-hover-bg': '#1E1A2A',
        'dropdown-ctrl-hover-border': '#8B4EFF',
        'dropdown-ctrl-hover-text': '#E0E0E0', // veya prestij-text-primary
        'dropdown-menu-bg': '#130F1E',
        'dropdown-menu-border': '#282338',
        'dropdown-menu-item-text': '#B0B0B8',
        'dropdown-menu-item-hover-bg': '#1E1A2A',
        'dropdown-menu-item-hover-text': '#FFFFFF',
        'dropdown-menu-item-active-bg': '#8B4EFF',
        'suggest-section-bg': '#08060D', // .suggest-game-section (hero-bg ve popular-section-bg ile aynı)
        'suggest-overlay-bg': 'rgba(8, 6, 13, 0.75)', // .feather-video-overlay

        'suggest-card-bg': 'rgba(19, 15, 30, 0.85)', // .suggest-option-card
        'suggest-card-border': 'rgba(255,255,255,0.1)',
        'suggest-card-title': '#F0F0F5', // .suggest-option-title
        'suggest-card-description': '#A8AEB8', // .suggest-option-description

        'suggest-btn-primary-bg': '#8B4EFF',
        'suggest-btn-primary-text': '#FFFFFF',
        'suggest-btn-primary-hover-bg': '#7A3EFF',

        'suggest-btn-secondary-bg': 'rgba(50,45,70,0.7)',
        'suggest-btn-secondary-text': '#D0C8E0',
        'suggest-btn-secondary-border': '#322D46',
        'suggest-btn-secondary-hover-bg': 'rgba(60,55,80,0.9)',

        'suggest-terms-text': '#B8C0C8',
        'suggest-terms-link': '#A98EFF',
        'suggest-terms-link-hover': '#C3AEFF',

        'suggest-main-title-text': '#FFFFFF',
        'stats-section-bg': '#08060D', // .site-stats-section (hero-bg vb. ile aynı)
    'stats-icon-bg': 'rgba(30, 28, 40, 0.7)', // .stat-icon background
    'stats-icon-border': 'rgba(255, 255, 255, 0.1)',
    'stats-icon-text': '#E0E0E0', // .stat-icon içindeki i'nin rengi (prestij-text-primary ile aynı)
    'stats-list-text': 'inherit', // Liste elemanları body'den rengi alacak gibi duruyor veya prestij-text-secondary
    'stats-footer-text-color': '#A0A8B0', // .stats-footer-text (prestij-text-muted ile benzer)
    'stats-divider-color': '#1A1423', // .section-divider (prestij-border-divider ile aynı)
    'section-bg-alt': '#050409',
    'discord-section-bg': '#050409',
    'footer-bg': '#0C0E0F', // #mainFooter background (prestij-bg-dark-1 ile aynı)
    'footer-text': '#A0A8B8', // #mainFooter color (prestij-text-muted ile benzer)
    'footer-border': '#1A1423', // border-bottom, border-top (prestij-border-divider ile aynı)
    'footer-main-title-text': '#E8E8F0', // .footer-main-title (prestij-text-primary ile benzer)
    'footer-column-title-text': '#FFFFFF', // .footer-column-title
    'footer-link-text': '#A0A8B8', // Footer linkleri (footer-text ile aynı)
    'footer-link-hover-text': '#8B4EFF',
    'footer-contact-label-text': '#808898', // .contact-label
    'footer-social-icon': '#A0A8B8',
    'footer-social-icon-hover': '#FFFFFF',
    'footer-bottom-bar-text': '#808898', // (footer-contact-label-text ile aynı)
    'footer-chimiya-link': '#A0A8B8',
    'footer-chimiya-link-hover': '#FFFFFF',
    'prestij-purple': '#8B4EFF',
'prestij-purple-darker': '#7A3EFF', // Hover için
'prestij-bg-dark-1': '#0C0E0F', // focus:ring-offset- için
'prestij-bg-dark-3': '#1A1A1D', // Input arka planı için
'prestij-border-secondary': '#28282C', // Input border
'prestij-text-online': '#2ECC71', // Örnek bir yeşil (Çevrim içi için)
    'prestij-text-offline': '#95A5A6', // Örnek bir gri (Çevrim dışı için)
    'prestij-text-logout': '#E74C3C', // Kırmızı (Çıkış Yap için)
    'prestij-dropdown-border-alt': '#3E266E', // Yeni kenarlık rengi
    'prestij-dropdown-bg': '#0D0D0D',      // Yeni arka plan rengi
    'prestij-divider-short': '#141414',     // Yeni kısa çizgi rengi
    'prestij-dropdown-border': '#31323B', // Dropdown ayraç çizgisi
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', 'sans-serif'],
      },
      fontSize: { // Orijinal CSS'deki bazı özel font boyutları için
        '2xs': '0.65rem', // Örnek: .side-item-type
        'xs-plus': '0.85em', // Örnek: .search-input, .btn
        'sm-plus': '0.9em', // Örnek: .nav-link, .dropdown-column ul li a
        'footer-base': '0.9em', // #mainFooter font-size
    'footer-bottom-bar-text-size': '0.8em',
    'footer-contact-label-size': '0.85em',
    'footer-social-icon-size': '1.3em',
      },
      maxWidth: { // Özel max-width sınıfları ekleyebilirsiniz
      '7xl': '1280px', // Tailwind'in varsayılan 7xl'ı
      'screen-xl': '1250px', // Sizin özel değeriniz için (tailwind.config.ts container.screens.xl ile aynı)
    },
      minHeight: {
        'header': '60px', // Orijinal #mainHeader min-height
        'suggest-section-feather': '550px',
      },
      spacing: { // Orijinal CSS'deki bazı özel boşluklar için (gap, padding vb.)
        'header-padding-x': '25px', // .header-container padding
        'nav-gap': '22px', // .main-navigation ul gap
        'actions-gap': '12px', // .user-actions gap
        'dropdown-col-gap': '40px', // .header-dropdown gap
      },
      boxShadow: {
        'header-dropdown': '0 8px 20px rgba(0,0,0,0.35)',
        'hero-top-project': '0 6px 15px rgba(0,0,0,0.2)', // Hafif bir başlangıç gölgesi
        'hero-top-project-hover': '0 8px 20px rgba(0,0,0,0.35)',
        'hero-main-showcase': '0 10px 30px rgba(0,0,0,0.15)',
        'hero-main-showcase-hover': '0 12px 35px rgba(0,0,0,0.2)',
        'hero-side-list-item-hover': '0 8px 20px rgba(0,0,0,0.3)',
        'hero-side-list-item-active': '0 0 0 2.5px #8B4EFF, 0 8px 25px rgba(139, 78, 255, 0.4)', // prestij-purple
        'popular-card': '0 6px 18px rgba(0,0,0,0.25)',
        'popular-card-hover': '0 10px 25px rgba(0,0,0,0.35)',
        'dropdown-menu': '0 4px 12px rgba(0,0,0,0.25)',
        'suggest-card': '0 6px 20px rgba(0,0,0,0.3)',
        'stats-icon-inner': 'inset 0 0 8px rgba(255, 255, 255, 0.1)', // Bu zaten kullanılıyor olmalı
      
        'stats-icon-glow-main': '0 0 25px 10px rgb(255, 255, 255)',
        'discord-banner-hover': '0 5px 20px rgba(0,0,0,0.2), 0 0 25px rgba(139, 78, 255, 0.3)',
      },
      keyframes: { // Özel animasyonlar için
    noticeableWobble: { // .animated-icon için
      '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' },
      '20%': { transform: 'translate(6px, -8px) rotate(3deg) scale(1.03)' },
      '40%': { transform: 'translate(-5px, 5px) rotate(-2.5deg) scale(0.97)' },
      '60%': { transform: 'translate(8px, 4px) rotate(2deg) scale(1.04)' },
      '80%': { transform: 'translate(-7px, -6px) rotate(-3deg) scale(0.96)' },
    },
    'dropdown-open': {
        '0%': { opacity: '0', marginTop: '0px' },
        '100%': { opacity: '1', marginTop: '10px'},
      },
        'dropdown-close': {
        '0%': { opacity: '1', marginTop: '10px'},
        '100%': { opacity: '0', marginTop: '0px'},
      }
  },
      animation: {
    'wobble-noticeable': 'noticeableWobble 3s ease-in-out infinite alternate',
    // Farklı süre ve gecikmeler için ayrı class'lar veya inline style kullanılabilir
    'wobble-1': 'noticeableWobble 3.8s ease-in-out 0.1s infinite alternate',
    'wobble-2-main': 'noticeableWobble 4.5s ease-in-out infinite alternate', // large-icon
    'wobble-3': 'noticeableWobble 4.2s ease-in-out 0.4s infinite alternate',
    'wobble-4': 'noticeableWobble 3.9s ease-in-out 0.2s infinite alternate',
    'dropdown-open': 'dropdown-open 0.2s ease-out forwards',
      'dropdown-close': 'dropdown-close 0.2s ease-in forwards',
  },
      transitionProperty: { // Daha fazla transition özelliği eklenebilir
        'height': 'height',
        'spacing': 'margin, padding',
      },
       textShadow: { // Eğer text-shadow plugin'iniz varsa ve kullanmak istiyorsanız
    // ... (mevcut textShadow'larınız) ...
    'suggest-title': '2px 3px 10px rgba(0,0,0,0.5)', // .suggest-main-title-right için
    'discord-title': '0 0 8px rgba(220, 200, 255, 0.3)',
  },
      spacing: {
    // ... (mevcut spacing'leriniz) ...
    'section-padding-y-feather': '250px', // .suggest-game-section.feather-video-layout padding
  },

    },
    aspectRatio: { // @tailwindcss/aspect-ratio plugin'i için
        '16/7': '16 / 7',
        '16/7.5': '16 / 7.5',
        '16/8': '16 / 8',
        // ... diğer oranlar eklenebilir
      },
      backgroundImage: { // Gradient'ler ve banner'lar için
        'hero-top-card-gradient': 'linear-gradient(to top, rgba(16, 12, 28, 0.95) 0%, rgba(16, 12, 28, 0.7) 60%, transparent 100%)',
        'hero-main-visual-overlay': 'linear-gradient(to top, rgba(12, 14, 15, 0.95) 0%, rgba(12, 14, 15, 0.5) 40%, transparent 70%)',
        'hero-side-list-fade': 'linear-gradient(to left, rgba(16, 12, 28, 0) 5%, rgba(16, 12, 28, 0.4) 35%, #100C1C 85%)', // #100C1C = hero-side-list-item-bg
        'slider-card-banner-fade': 'linear-gradient(to bottom, rgba(16, 12, 28, 0.7) 0%, rgba(16, 12, 28, 0.3) 50%, transparent 100%)', // .banner-top-to-bottom-fade
        'slider-card-content-overlay': 'linear-gradient(to top, rgb(0, 0, 0) 0%, transparent 100%)', // .slider-card::after (hover'da gelen karartı)
      }
  },
  plugins: [
    // require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'), // Eğer banner'larda kullanacaksak
    // require('tailwindcss-textshadow'), // Kullanıyorsanız
  ],
};