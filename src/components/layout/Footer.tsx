// src/components/layout/Footer.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  const year = new Date().getFullYear(); // Dinamik yıl için

  const gameLinks = [
    { label: "Oyun 1", href: "#" }, { label: "Oyun 2", href: "#" },
    { label: "Oyun 3", href: "#" }, { label: "Oyun 4", href: "#" },
    { label: "Oyun 5", href: "#" },
  ];
  const animeLinks = [
    { label: "Anime 1", href: "#" }, { label: "Anime 2", href: "#" },
    { label: "Anime 3", href: "#" }, { label: "Anime 4", href: "#" },
    { label: "Anime 5", href: "#" },
  ];
  const aboutLinks = [
    { label: "Ekip Üyelerimiz", href: "#" },
    { label: "Site Hakkında", href: "#" },
  ];
  const socialLinks = [
    { label: "Facebook", href: "#", iconClass: "fab fa-facebook-f" },
    { label: "X (Twitter)", href: "#", iconClass: "fab fa-twitter" }, // veya fa-x-twitter
    { label: "Instagram", href: "#", iconClass: "fab fa-instagram" },
    { label: "TikTok", href: "#", iconClass: "fab fa-tiktok" },
    { label: "Discord", href: "#", iconClass: "fab fa-discord" },
  ];

  return (
    <footer id="mainFooter" className="bg-footer-bg text-footer-text text-footer-base pt-10">
      {/* Üst Bar */}
      <div className="footer-top-bar border-b border-footer-border pb-6 mb-8">
        <div className="container mx-auto px-4">
          <h2 className="footer-main-title text-xl sm:text-2xl font-semibold text-footer-main-title-text">
            PrestiJ STUDIO
          </h2>
        </div>
      </div>

      {/* Ana İçerik Alanı */}
      <div className="container mx-auto footer-content-container px-4 flex flex-wrap justify-between gap-x-6 gap-y-8 pb-10">
        {/* Logo Sütunu */}
        <div className="footer-logo-column flex-shrink-0 w-full sm:w-auto mb-6 sm:mb-0">
          <Image 
            src="/images/logo-placeholder.png" // public/images altında olmalı
            alt="PrestiJ Logo" 
            width={120} 
            height={120} // Width ile aynı yapıp object-fit kullanabiliriz veya gerçek boyutları
            className="footer-logo-img w-[120px] h-auto mx-auto sm:mx-0" 
          />
        </div>

        {/* Link Sütunları */}
        <div className="footer-links-column flex-1 min-w-[150px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-base font-semibold text-footer-column-title-text mb-4 uppercase tracking-wider">OYUNLAR</h4>
          <ul className="space-y-2.5">
            {gameLinks.map(link => (
              <li key={link.label}><Link href={link.href} className="text-footer-link-text hover:text-footer-link-hover-text hover:underline transition-colors">{link.label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer-links-column flex-1 min-w-[150px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-base font-semibold text-footer-column-title-text mb-4 uppercase tracking-wider">ANİMELER</h4>
          <ul className="space-y-2.5">
            {animeLinks.map(link => (
              <li key={link.label}><Link href={link.href} className="text-footer-link-text hover:text-footer-link-hover-text hover:underline transition-colors">{link.label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer-links-column flex-1 min-w-[150px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-base font-semibold text-footer-column-title-text mb-4 uppercase tracking-wider">HAKKIMIZDA</h4>
          <ul className="space-y-2.5">
            {aboutLinks.map(link => (
              <li key={link.label}><Link href={link.href} className="text-footer-link-text hover:text-footer-link-hover-text hover:underline transition-colors">{link.label}</Link></li>
            ))}
          </ul>
        </div>

        {/* İletişim Sütunu */}
        <div className="footer-contact-column flex-1 min-w-[200px] sm:min-w-[220px]">
          <h4 className="footer-column-title text-base font-semibold text-footer-column-title-text mb-4 uppercase tracking-wider">İLETİŞİM</h4>
          <div>
            <p className="contact-label text-footer-contact-label-text text-footer-contact-label-size mb-2">Sosyal Medya</p>
            <div className="social-icons-footer flex items-center gap-3 mb-4">
              {socialLinks.map(social => (
                <Link key={social.label} href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer"
                   className="text-footer-social-icon hover:text-footer-social-icon-hover hover:scale-110 transition-all text-footer-social-icon-size">
                  <i className={social.iconClass}></i>
                </Link>
              ))}
            </div>
            <p className="contact-label text-footer-contact-label-text text-footer-contact-label-size mb-1 mt-4">E-Mail</p>
            <a href="mailto:test@prestudublaj.com" className="email-link text-footer-link-text hover:text-footer-link-hover-text hover:underline font-medium transition-colors break-all">
              test@prestudublaj.com
            </a>
          </div>
        </div>
      </div>

      {/* Alt Bar */}
      <div className="footer-bottom-bar border-t border-footer-border py-5 text-footer-bottom-bar-text-size text-footer-bottom-bar-text">
        <div className="container mx-auto footer-bottom-content px-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="copyright-text-wrapper text-center sm:text-left">
            <p className="copyright-text">© {year} PrestiJ Studio Tüm Hakları Saklıdır.</p>
          </div>
          <div className="developer-credit text-center">
            <p>
              <Link href="#" target="_blank" rel="noopener noreferrer" className="chimiya-link text-footer-chimiya-link hover:text-footer-chimiya-link-hover hover:border-b hover:border-footer-chimiya-link-hover transition-colors">
                Chimiya
              </Link> tarafından geliştirildi
            </p>
          </div>
          <div className="footer-legal-nav-wrapper text-center sm:text-right">
            <nav className="footer-legal-nav">
              <Link href="#" className="hover:text-white hover:underline transition-colors">Kullanım Koşulları</Link>
              <span className="mx-2">|</span>
              <Link href="#" className="hover:text-white hover:underline transition-colors">Güvenlik Politikası</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;