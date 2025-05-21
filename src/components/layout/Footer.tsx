// src/components/layout/Footer.tsx
import Link from 'next/link';
import Image from 'next/image';
// İkonları react-icons'tan import etmeyi unutma (eğer yüklüyse)
// import { FaFacebookF, FaTwitter, FaInstagram, FaTiktok, FaDiscord } from 'react-icons/fa';

// react-icons yüklü değilse veya sorun çıkarıyorsa, şimdilik ikonları metin olarak yazabilirsin
// ya da Heroicons'tan benzerlerini bulabilirsin.

export default function Footer() {
  // Sosyal medya linkleri için sahte veri (gerçek linklerle değiştirilecek)
  const socialLinks = [
    { href: "#", label: "Facebook" /* icon: <FaFacebookF /> */ },
    { href: "#", label: "Twitter" /* icon: <FaTwitter /> */ },
    { href: "#", label: "Instagram" /* icon: <FaInstagram /> */ },
    { href: "#", label: "TikTok" /* icon: <FaTiktok /> */ },
    { href: "#", label: "Discord" /* icon: <FaDiscord /> */ },
  ];

  return (
    <footer id="mainFooter" className="bg-bg-primary-dark text-gray-400 pt-10 text-sm"> {/* Ana renkler config'den */}
      {/* Footer Top Bar */}
      <div className="footer-top-bar border-b border-gray-700/50 pb-6 mb-8">
        <div className="container mx-auto px-4"> {/* px-4 eklendi container için */}
          <h2 className="footer-main-title text-2xl font-semibold text-gray-100">PrestiJ STUDIO</h2>
        </div>
      </div>

      {/* Footer Content Container */}
      <div className="container footer-content-container mx-auto px-4 flex flex-wrap justify-between gap-8 pb-10">
        {/* Logo Sütunu */}
        <div className="footer-logo-column shrink-0 w-full sm:w-auto mb-6 sm:mb-0">
          {/* public klasöründe images/logo-placeholder.png olduğundan emin ol */}
          <Image src="/images/logo-placeholder.png" alt="PrestiJ Logo" width={120} height={50} className="footer-logo-img h-auto" /> {/* height="auto" veya orjinal boyut */}
        </div>

        {/* Link Sütunları */}
        <div className="footer-links-column flex-1 min-w-[150px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-base font-semibold text-white mb-4 uppercase tracking-wider">OYUNLAR</h4>
          <ul>
            {['Oyun 1', 'Oyun 2', 'Oyun 3', 'Oyun 4', 'Oyun 5'].map(game => (
              <li key={game} className="mb-2">
                <Link href="#" className="hover:text-text-brand-purple hover:underline">{game}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-links-column flex-1 min-w-[150px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-base font-semibold text-white mb-4 uppercase tracking-wider">ANİMELER</h4>
          <ul>
            {['Anime 1', 'Anime 2', 'Anime 3', 'Anime 4', 'Anime 5'].map(anime => (
              <li key={anime} className="mb-2">
                <Link href="#" className="hover:text-text-brand-purple hover:underline">{anime}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-links-column flex-1 min-w-[150px] sm:min-w-[180px]">
          <h4 className="footer-column-title text-base font-semibold text-white mb-4 uppercase tracking-wider">HAKKIMIZDA</h4>
          <ul>
            <li className="mb-2"><Link href="#" className="hover:text-text-brand-purple hover:underline">Ekip Üyelerimiz</Link></li>
            <li className="mb-2"><Link href="#" className="hover:text-text-brand-purple hover:underline">Site Hakkında</Link></li>
          </ul>
        </div>

        {/* İletişim Sütunu */}
        <div className="footer-contact-column flex-1 min-w-[180px] sm:min-w-[220px]">
          <h4 className="footer-column-title text-base font-semibold text-white mb-4 uppercase tracking-wider">İLETİŞİM</h4>
          <p className="contact-label text-xs text-gray-500 mb-2 mt-0">Sosyal Medya</p>
          <div className="social-icons-footer flex gap-3 mb-4">
            {socialLinks.map(social => (
              <Link key={social.label} href={social.href} aria-label={social.label} className="text-gray-400 hover:text-white hover:scale-110 transition-all text-xl">
                {/* {social.icon || social.label} // İkon yoksa label yazsın */}
                {social.label.substring(0,1)} {/* Şimdilik baş harfi */}
              </Link>
            ))}
          </div>
          <p className="contact-label text-xs text-gray-500 mb-2">E-Mail</p>
          <Link href="mailto:test@prestudublaj.com" className="email-link font-medium hover:text-text-brand-purple hover:underline">test@prestudublaj.com</Link>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar border-t border-gray-700/50 py-5 text-xs text-gray-500">
        <div className="container footer-bottom-content mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <div className="copyright-text-wrapper">
            <p className="copyright-text">© {new Date().getFullYear()} PrestiJ Studio Tüm Hakları Saklıdır.</p>
          </div>
          <div className="developer-credit">
            <p>
              <Link href="CHIMIYA_LINKI_BURAYA" target="_blank" rel="noopener noreferrer" className="chimiya-link font-medium text-gray-400 hover:text-white hover:border-b hover:border-white transition-colors">
                Chimiya
              </Link> tarafından geliştirildi
            </p>
          </div>
          <div className="footer-legal-nav-wrapper">
            <nav className="footer-legal-nav flex gap-2 justify-center sm:justify-end">
              <Link href="#" className="hover:text-gray-200 hover:underline">Kullanım Koşulları</Link>
              <span className="hidden sm:inline">|</span>
              <Link href="#" className="hover:text-gray-200 hover:underline">Güvenlik Politikası</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}