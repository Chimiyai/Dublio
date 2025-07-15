// src/components/layout/Footer.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// API'den gelecek proje verisi için basit bir tip (sadece linkler için gerekli)
interface FooterProjectLink {
  slug: string;
  title: string;
  type: 'oyun' | 'anime' | string; // API'den 'oyun' veya 'anime' olarak gelmeli
}

// API'den veri çekme fonksiyonu
async function fetchLatestFooterItems(type: 'oyun' | 'anime', limit: number): Promise<FooterProjectLink[]> {
  try {
    const res = await fetch(`/api/projects?type=${type}&limit=${limit}&orderBy=createdAt`);
    if (!res.ok) {
      console.error(`Footer için ${type} verisi çekilemedi, status: ${res.status}`);
      return [];
    }
    const data = await res.json();
    // Sadece slug, title ve type alalım (API daha fazla alan dönebilir)
    return data.map((item: any) => ({
      slug: item.slug,
      title: item.title,
      type: item.type,
    }));
  } catch (error) {
    console.error(`Footer için ${type} fetch hatası:`, error);
    return [];
  }
}


const Footer = () => {
  const [year, setCurrentYear] = useState('');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const [gameLinks, setGameLinks] = useState<FooterProjectLink[]>([]);
  const [animeLinks, setAnimeLinks] = useState<FooterProjectLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const 작업 = async () => { // 'loadData' yerine Korece bir kelime kullandım, isterseniz değiştirebilirsiniz :)
      setIsLoading(true);
      try {
        const [games, animes] = await Promise.all([
          fetchLatestFooterItems('oyun', 5),
          fetchLatestFooterItems('anime', 5)
        ]);
        setGameLinks(games);
        setAnimeLinks(animes);
      } catch (error) {
        // Hata zaten fetchLatestFooterItems içinde loglanıyor
      } finally {
        setIsLoading(false);
      }
    };
    작업();
  }, []);


  const aboutLinks = [
    { label: "Kadromuz", href: "/kadromuz" }, // Gerçek yolları kullanın
    { label: "Site Hakkında", href: "/hakkimizda" }, // Gerçek yolları kullanın
  ];
  const socialLinks = [
    { label: "Instagram", href: "https://www.instagram.com/dublio_studios/", iconClass: "fab fa-instagram" },
    { label: "TikTok", href: "https://www.tiktok.com/@dubliostudiofficial", iconClass: "fab fa-tiktok" },
    { label: "Discord", target:'_blank', href: "https://discord.gg/9hX4GJtEsX", iconClass: "fab fa-discord" },
    { label: "Youtube", target:'_blank', href: "https://www.youtube.com/channel/UCuChIjgg-T3q1V6sPpPApdQ", iconClass: "fab fa-youtube" },
  ];

  // tailwind.config.js'de bu renklerin tanımlı olması beklenir:
  // bg-footer-bg, text-footer-text, border-footer-border, text-footer-main-title-text,
  // text-footer-column-title-text, text-footer-link-text, text-footer-link-hover-text,
  // text-footer-contact-label-text, text-footer-social-icon, text-footer-social-icon-hover,
  // text-footer-bottom-bar-text, text-footer-chimiya-link, text-footer-chimiya-link-hover

  return (
    <footer id="mainFooter" className="bg-footer-bg text-footer-text text-sm pt-10"> {/* text-footer-base yerine text-sm */}
      {/* Üst Bar */}
      <div className="footer-top-bar border-b border-footer-border pb-6 mb-8">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-block">
            <h2 className="footer-main-title text-xl sm:text-2xl font-semibold text-footer-main-title-text hover:opacity-80 transition-opacity">
              DUBLIO
            </h2>
          </Link>
        </div>
      </div>

      {/* Ana İçerik Alanı */}
      <div className="container mx-auto footer-content-container px-4 flex flex-wrap justify-between gap-x-6 gap-y-8 pb-10">
        {/* Logo Sütunu */}
        <div className="footer-logo-column flex-shrink-0 w-full sm:w-auto mb-6 sm:mb-0 flex justify-center sm:justify-start">
          <Link href="/" className="inline-block">
            <Image 
              src="/images/logo-placeholder.png" // Gerçek logo yolunuzu kullanın
              alt="Dublio Logo" 
              width={120} 
              height={120}
              className="footer-logo-img w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] object-contain" // object-contain or object-cover
            />
          </Link>
        </div>

        {/* Link Sütunları */}
        <div className="footer-links-column flex-1 min-w-[150px] xs:min-w-[170px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-sm font-semibold text-footer-column-title-text mb-4 uppercase tracking-wider">OYUNLAR</h4>
          {isLoading ? (
            <ul className="space-y-2.5">
              {[...Array(3)].map((_, i) => <li key={i} className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4"></li>)}
            </ul>
          ) : gameLinks.length > 0 ? (
            <ul className="space-y-2.5">
              {gameLinks.map(link => (
                <li key={link.slug}>
                  <Link 
                    href={`/oyunlar/${link.slug}`} // Dinamik URL
                    className="text-footer-link-text hover:text-footer-link-hover-text hover:underline transition-colors text-xs sm:text-sm"
                    title={link.title}
                  >
                    {link.title.length > 25 ? `${link.title.substring(0, 25)}...` : link.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">Henüz oyun yok.</p>
          )}
        </div>

        <div className="footer-links-column flex-1 min-w-[150px] xs:min-w-[170px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-sm font-semibold text-footer-column-title-text mb-4 uppercase tracking-wider">ANİMELER</h4>
          {isLoading ? (
             <ul className="space-y-2.5">
             {[...Array(3)].map((_, i) => <li key={i} className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4"></li>)}
           </ul>
          ) : animeLinks.length > 0 ? (
            <ul className="space-y-2.5">
              {animeLinks.map(link => (
                <li key={link.slug}>
                  <Link 
                    href={`/animeler/${link.slug}`} // Dinamik URL
                    className="text-footer-link-text hover:text-footer-link-hover-text hover:underline transition-colors text-xs sm:text-sm"
                    title={link.title}
                  >
                     {link.title.length > 25 ? `${link.title.substring(0, 25)}...` : link.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">Henüz anime yok.</p>
          )}
        </div>

        <div className="footer-links-column flex-1 min-w-[150px] xs:min-w-[170px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-sm font-semibold text-footer-column-title-text mb-4 uppercase tracking-wider">HAKKIMIZDA</h4>
          <ul className="space-y-2.5">
            {aboutLinks.map(link => (
              <li key={link.label}>
                <Link href={link.href} className="text-footer-link-text hover:text-footer-link-hover-text hover:underline transition-colors text-xs sm:text-sm">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* İletişim Sütunu */}
        <div className="footer-contact-column flex-1 min-w-[200px] xs:min-w-[220px]">
          <h4 className="footer-column-title text-sm font-semibold text-footer-column-title-text mb-4 uppercase tracking-wider">İLETİŞİM</h4>
          <div>
            <p className="contact-label text-footer-contact-label-text text-xs mb-2">Sosyal Medya</p> {/* text-footer-contact-label-size kaldırıldı, direkt text-xs vb. */}
            <div className="social-icons-footer flex items-center gap-3.5 mb-4"> {/* text-footer-social-icon-size kaldırıldı */}
              {socialLinks.map(social => (
                <Link key={social.label} href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer"
                   className="text-footer-social-icon hover:text-footer-social-icon-hover hover:scale-110 transition-all text-lg"> {/* ikon boyutu text-lg */}
                  <i className={social.iconClass}></i>
                </Link>
              ))}
            </div>
            <p className="contact-label text-footer-contact-label-text text-xs mb-1 mt-4">E-Mail</p>
            <a href="mailto:iletisim@dubliostudio.com" className="email-link text-footer-link-text hover:text-footer-link-hover-text hover:underline font-medium transition-colors break-all text-xs sm:text-sm">
              iletisim@dubliostudio.com {/* Gerçek mail adresi */}
            </a>
          </div>
        </div>
      </div>

      {/* Alt Bar */}
      <div className="footer-bottom-bar border-t border-footer-border py-5 text-xs text-footer-bottom-bar-text"> {/* text-footer-bottom-bar-text-size kaldırıldı */}
        <div className="container mx-auto footer-bottom-content px-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="copyright-text-wrapper text-center sm:text-left">
            <p className="copyright-text">© {year} Dublio Tüm Hakları Saklıdır.</p>
          </div>
          <div className="developer-credit text-center">
            <p>
              <Link href="https://guns.lol/chimiya" target="_blank" rel="noopener noreferrer" className="chimiya-link text-footer-chimiya-link hover:text-footer-chimiya-link-hover hover:border-b hover:border-footer-chimiya-link-hover transition-colors">
                Chimiya
              </Link> tarafından geliştirildi
            </p>
          </div>
          <div className="footer-legal-nav-wrapper text-center sm:text-right">
            <nav className="footer-legal-nav">
              <Link href="/kullanim-kosullari" className="hover:text-white hover:underline transition-colors">Kullanım Koşulları</Link>
              <span className="mx-1.5 sm:mx-2">|</span>
              <Link href="/gizlilik-politikasi" className="hover:text-white hover:underline transition-colors">Gizlilik Politikası</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;