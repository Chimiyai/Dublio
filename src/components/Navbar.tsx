// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react'; // Oturum için
import { useState } from 'react'; // Mobil menü için
import { Bars3Icon, XMarkIcon, BellIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Dropdown içerik tipleri (basitleştirilmiş)
interface SimpleDropdownLink {
  href: string;
  text: string;
  iconSrc?: string;
  isSpecial?: boolean; // 'Oyun Ekle +', 'Liste Oluştur +' gibi linkler için
}

interface SimpleDropdownColumn {
  title: string;
  links: SimpleDropdownLink[];
}

interface SimpleDropdownContent {
  columns: SimpleDropdownColumn[];
}

// Sahte Dropdown İçerikleri (HTML'e göre)
const oyunlarDropdownContent: SimpleDropdownContent = {
  columns: [
    {
      title: "OYUNLAR",
      links: [
        { href: "#", text: "Tüm Oyunlar (3,704)" },
        { href: "#", text: "Yeni Eklenenler (80)" },
      ],
    },
    {
      title: "FAVORİ OYUNLARIM",
      links: [
        { href: "#", text: "Oyun Adı 1", iconSrc: "/images/game-icon-placeholder1.png" },
        { href: "#", text: "Oyun Ekle +", isSpecial: true },
      ],
    },
  ]
};

const animelerDropdownContent: SimpleDropdownContent = {
  columns: [
    {
      title: "ANİMELER",
      links: [{ href: "#", text: "Tüm Animeler (1,250)" }],
    },
    {
      title: "İZLEME LİSTEM",
      links: [{ href: "#", text: "Liste Oluştur +", isSpecial: true }],
    },
  ]
};

// HeaderDropdown Alt Component'i (CSS hover ile açılacak)
interface HeaderDropdownProps {
  id: string; // HTML'deki ID'ye karşılık
  content: SimpleDropdownContent;
}

function HeaderDropdown({ id, content }: HeaderDropdownProps) {
  return (
    <div
      id={id} // HTML'deki ID
      className="header-dropdown absolute top-full left-0 w-full bg-secondary-dark shadow-2xl z-[990] p-6 md:p-8 flex gap-8 md:gap-10
                 opacity-0 invisible group-hover/navitem:opacity-100 group-hover/navitem:visible
                 translate-y-[-10px] group-hover/navitem:translate-y-0
                 pointer-events-none group-hover/navitem:pointer-events-auto
                 transition-all duration-250 ease-out"
    >
      {content.columns.map((column, colIndex) => (
        <div key={colIndex} className="dropdown-column flex-1">
          <h3 className="text-xs text-gray-500 uppercase mb-4 tracking-wider font-medium">{column.title}</h3>
          <ul>
            {column.links.map((link, linkIndex) => (
              <li key={linkIndex} className="mb-2">
                <Link
                  href={link.href}
                  className={`text-sm flex items-center gap-2 py-1 
                              ${link.isSpecial ? 'text-gray-600 italic hover:text-text-brand-purple' : 'text-gray-300 hover:text-text-brand-purple'}`}
                >
                  {link.iconSrc && (
                    <Image src={link.iconSrc} alt={link.text} width={24} height={24} className="rounded" />
                  )}
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}


export default function Navbar() {
  const { data: session, status } = useSession(); // Oturum bilgisi
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ana navigasyon linkleri ve dropdown tetikleyicileri
  const navItems = [
    { label: 'Oyunlar', dropdownId: 'oyunlarDropdown', dropdownContent: oyunlarDropdownContent },
    { label: 'Animeler', dropdownId: 'animelerDropdown', dropdownContent: animelerDropdownContent },
    { label: 'Kadromuz', href: '/kadromuz' },
    { label: 'Bize Katıl!', target:'_blank', href: 'https://discord.gg/8Uh4yrXeBg' },
  ];

  return (
    <header id="mainHeader" className="bg-bg-primary-dark text-gray-300 w-full sticky top-0 z-[1000] border-b border-gray-700/50">
      <div className="header-container container mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">

        {/* Mobil Menü Toggle (Sol) */}
        <button
          className="mobile-menu-toggle lg:hidden text-gray-400 hover:text-text-brand-purple p-2 -ml-2"
          id="mobileMenuToggle"
          aria-label="Menüyü aç/kapat"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {/* Font Awesome yerine Heroicon kullandım, istersen i etiketi ile Font Awesome kullanabilirsin */}
          {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>

        {/* Logo Alanı (Mobil için ortada, masaüstünde direkt solda) */}
        {/* HTML'deki gibi absolute konumlandırma yerine flex order ile de yönetilebilir */}
        <div className="logo-area flex items-center gap-2 lg:order-1">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo-placeholder.png" alt="PrestiJ Logo" width={45} height={45} className="site-logo h-9 sm:h-10 w-auto" priority />
            <span className="site-name text-lg sm:text-xl font-medium text-gray-100 hidden sm:inline">PrestiJ</span>
          </Link>
        </div>

        {/* Header Ortası (Masaüstü Navigasyon ve Arama) */}
        <div className="header-center desktop-only hidden lg:flex items-center gap-6 lg:order-2 flex-grow justify-center"> {/* justify-center ile ortala */}
          <nav className="main-navigation">
            <ul className="flex items-center gap-x-5 xl:gap-x-6">
              {navItems.map((item) => (
                <li key={item.label} className="group/navitem relative"> {/* Dropdown için parent group */}
                  {item.href ? (
                    <Link href={item.href} className="nav-link text-sm text-gray-300 hover:text-text-brand-purple py-2 transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    // Dropdown toggle butonu (veya a etiketi, ama buton daha uygun olabilir)
                    <button
                      className="nav-link text-sm text-gray-300 hover:text-text-brand-purple py-2 relative flex items-center group-hover/navitem:text-text-brand-purple transition-colors"
                      data-dropdown={item.dropdownId} // HTML'deki gibi data attribute
                    >
                      {item.label}
                      <span className="dropdown-indicator ml-1"> {/* Heroicon veya FontAwesome ikonu */}
                        <ChevronDownIcon className="h-3.5 w-3.5 transition-transform group-hover/navitem:rotate-180" />
                      </span>
                    </button>
                  )}
                  {/* Dropdown içeriği (sadece dropdownContent varsa) */}
                  {item.dropdownContent && item.dropdownId && (
                    <HeaderDropdown id={item.dropdownId} content={item.dropdownContent} />
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="search-area relative">
            {/* HTML'deki gibi input, gerekirse ikon eklenebilir */}
            <input
              type="text"
              placeholder="İçerik Arat"
              className="search-input bg-gray-800 text-gray-300 border border-gray-700 rounded-md py-1.5 px-3 text-xs outline-none w-48 focus:border-text-brand-purple focus:bg-gray-700"
            />
          </div>
        </div>

        {/* Kullanıcı Eylemleri (Sağ) */}
        <div className="user-actions flex items-center gap-2 sm:gap-3 lg:order-3">
          <button className="notification-bell text-gray-400 hover:text-text-brand-purple p-1.5 rounded-full text-lg hidden sm:inline-block" aria-label="Bildirimler">
            {/* <i className="fas fa-bell"></i> Font Awesome veya Heroicon */}
            <BellIcon className="h-5 w-5" />
          </button>

          {status === 'authenticated' && session?.user ? (
            <>
              {/* <Link href="/profil" className="text-xs ...">{session.user.name}</Link> */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn btn-logout bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 px-3 rounded-md font-medium whitespace-nowrap"
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link href="/giris" className="btn btn-login text-xs py-1.5 px-3 rounded-md font-medium border border-gray-700 hover:bg-text-brand-purple hover:border-text-brand-purple hover:text-white hidden sm:inline-block whitespace-nowrap">
                Giriş Yap
              </Link>
              {/* Kayıt Ol butonu mobil menüde olabilir veya burada */}
            </>
          )}
          <button className="btn btn-download bg-secondary-dark border-secondary-dark hover:bg-text-brand-purple hover:border-text-brand-purple hover:text-white text-xs py-1.5 px-3 rounded-md font-medium hidden md:inline-block whitespace-nowrap">
            PrestiJ'i İndir
          </button>
        </div>
      </div>

      {/* Mobil Yan Panel (Basitleştirilmiş, sadece aç/kapa) */}
      {isMobileMenuOpen && (
        <>
          <div
            id="mobileSidePanel" // Senin HTML'indeki ID
            className="mobile-side-panel fixed top-0 left-0 w-4/5 max-w-xs h-full bg-bg-primary-dark shadow-2xl z-[1001] transition-transform duration-300 ease-in-out lg:hidden border-r border-gray-700/50 flex flex-col transform translate-x-0"
          >
            <div className="panel-header p-4 flex justify-end items-center border-b border-gray-700/50">
              <button className="close-panel-btn text-gray-400 hover:text-text-brand-purple p-1" id="closeSidePanelBtn" onClick={() => setIsMobileMenuOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="panel-content flex-grow overflow-y-auto py-2">
              {/* Mobil menü içeriği senin JS'deki menuData'dan doldurulabilir */}
              <ul>
                {navItems.map(item => ( // Masaüstü linklerini kullanalım şimdilik
                     <li key={item.label} className="border-b border-gray-700/50">
                        <Link href={item.href || '#'} className="block p-4 text-gray-200 hover:bg-text-brand-purple/10 hover:text-text-brand-purple" onClick={() => setIsMobileMenuOpen(false)}>
                            {item.label}
                        </Link>
                    </li>
                ))}
                {/* Mobil için Giriş/Kayıt vs. ayrıca eklenebilir */}
              </ul>
            </nav>
          </div>
          <div
            className="overlay fixed inset-0 bg-black/70 z-[1000] lg:hidden"
            id="overlay" // Senin HTML'indeki ID
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        </>
      )}
      
    </header>
  );
}