// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useRef, Fragment, JSX } from 'react';
import UnreadMessagesBadge from './UnreadMessagesBadge';
import { useSession, signOut } from 'next-auth/react';
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChatBubbleOvalLeftEllipsisIcon, // Mesajlar ikonu için
  UserCircleIcon, // Avatar için placeholder
  ArrowRightOnRectangleIcon, // Çıkış ikonu
  
  UserIcon as ProfileIcon, // Profil ikonu
  UsersIcon, // Arkadaşlar ikonu
  ShoppingBagIcon as LibraryIconOutline
} from '@heroicons/react/24/outline';
import SearchOverlay from './SearchOverlay';
import { cn } from '@/lib/utils';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import NotificationBell from './NotificationBell';

export const dynamic = 'force-dynamic';

// Stats için tip tanımı
interface HeaderStats {
  totalDubbedGames: number;
  totalDubbedAnime: number;
  recentGames: number; // Son eklenen oyunlar için
}
// Sahte veri
const navLinksData = [
  { label: 'Oyunlar', href: 'oyunlar', dropdownId: 'oyunlarDropdown' },
  { label: 'Animeler', href: 'animeler', dropdownId: 'animelerDropdown' },
  { label: 'Kadromuz', href: '/kadromuz' },
  { label: 'Bize Katıl!', target:'_blank', href: 'https://discord.gg/8Uh4yrXeBg' },
];

// Tip tanımlamalarını ekleyelim (isteğe bağlı ama iyi pratik)
interface NavLinkItem {
  label: string;
  href: string;
  dropdownId?: string;
}
interface DropdownItem {
  label: string;
  href: string;
  icon?: string;
  isAction?: boolean;
}
interface MobileMenuItemCore {
    label: string;
    href?: string;
}
interface MobileMenuLinkItem extends MobileMenuItemCore {
    action: 'link';
    href: string;
}
interface MobileMenuSubmenuItem extends MobileMenuItemCore {
    action: 'submenu';
    target: string;
    iconRight?: JSX.Element;
    label: string; // label burada da olmalı
}
type MobileMenuItem = MobileMenuLinkItem | MobileMenuSubmenuItem;


const Header = () => {
  const [downloadButtonText, setDownloadButtonText] = useState("PrestiJ'i İndir");
  const [isDownloadClicked, setIsDownloadClicked] = useState(false); // Butonun tıklanıp tıklanmadığını tutar
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: session, status } = useSession();
  const isLoadingSession = status === "loading";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); // Profil dropdown state'i
  const [isClosing, setIsClosing] = useState(false); // Dropdown kapanma animasyonu için
  const [mobileSubMenu, setMobileSubMenu] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null); // Profil dropdown için ref
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<HeaderStats>({
    totalDubbedGames: 0,
    totalDubbedAnime: 0,
    recentGames: 0
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Stats verilerini çek
  useEffect(() => {
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Stats fetch failed');
      const data = await res.json();
      setStats({
        totalDubbedGames: data.totalDubbedGames,
        totalDubbedAnime: data.totalDubbedAnime,
        recentGames: data.recentGames || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  fetchStats();
}, []);

const oyunlarDropdownContent = {
    main: [
      { label: `Tüm Oyunlar (${stats.totalDubbedGames})`, href: '/oyunlar' },
      { label: `Yeni Eklenenler (${stats.recentGames})`, href: '/oyunlar/yeni' },
    ],
    favorites: [
      { label: 'Oyun Ekle +', href: '/oyunlar/ekle', isAction: true },
    ],
  };

  const animelerDropdownContent = {
    main: [
      { label: `Tüm Animeler (${stats.totalDubbedAnime})`, href: '/animeler' },
    ],
    watchlist: [
      { label: 'Liste Oluştur +', href: '/animeler/liste-olustur', isAction: true },
    ],
  };

  const navLinks: NavLinkItem[] = [ // Tip ataması eklendi
    ...navLinksData,
    ...(session?.user?.role === 'admin' && !isLoadingSession ? [{ label: 'Admin Paneli', href: '/admin' }] : [])
  ];

  const openSearchOverlay = () => {
    setIsSearchOpen(true);
    // Opsiyonel: Body scroll'u engelle
    document.body.style.overflow = 'hidden';
  };

  const closeSearchOverlay = () => {
    setIsSearchOpen(false);
    document.body.style.overflow = '';
    if (searchInputRef.current) { // Overlay kapanınca header'daki input'un focus'unu kaldır
        searchInputRef.current.blur();
    }
  };

  // Header'daki input'a focus olunca (tıklanınca) overlay'i aç
  const handleHeaderSearchFocus = () => {
    if (!isSearchOpen) { // Eğer zaten açıksa tekrar açma
        openSearchOverlay();
    }
  };

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const targetElement = event.target as Node;

    // Profil dropdown kontrolü
    if (isProfileDropdownOpen && profileDropdownRef.current && !profileDropdownRef.current.contains(targetElement)) {
      const profileToggle = headerRef.current?.querySelector('button[data-dropdown-type="profile"]');
      if (!profileToggle || (profileToggle && !profileToggle.contains(targetElement))) {
        // Animasyonlu kapanma için toggleProfileDropdown kullan
        toggleProfileDropdown();
      }
    }

    // Profil dropdown kontrolü
    if (isProfileDropdownOpen && profileDropdownRef.current && !profileDropdownRef.current.contains(targetElement)) {
      const profileToggle = headerRef.current?.querySelector('button[data-dropdown-type="profile"]');
      if (!profileToggle || (profileToggle && !profileToggle.contains(targetElement))) {
        setIsProfileDropdownOpen(false);
      }
    }

    // Mobil menü kontrolü
    if (isMobileMenuOpen && mobilePanelRef.current && !mobilePanelRef.current.contains(targetElement)) {
      const mobileToggle = document.getElementById('mobileMenuToggle');
      if (!mobileToggle || (mobileToggle && !mobileToggle.contains(targetElement))) {
        setIsMobileMenuOpen(false);
        setMobileSubMenu(null);
      }
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [activeDropdown, isProfileDropdownOpen, isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen || activeDropdown) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
        setMobileSubMenu(null);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen, activeDropdown, isProfileDropdownOpen]);

  const toggleDropdown = (dropdownId: string) => {
    const handleToggle = (e: React.MouseEvent) => {
      // Fare olaylarını engelle
      e.preventDefault();
      e.stopPropagation();
      
      setActiveDropdown(prev => (prev === dropdownId ? null : dropdownId));
      setIsMobileMenuOpen(false);
    };

    return handleToggle;
  };

  const toggleNavDropdown = (dropdownId: string, event?: React.MouseEvent) => {
    setActiveDropdown(prev => {
      if (prev === dropdownId) {
        return null; // Açıksa kapat
      } else {
        setIsProfileDropdownOpen(false); // Diğer dropdown'ı kapat
        setIsMobileMenuOpen(false); // Mobil menüyü kapat
        return dropdownId; // Yenisini aç
      }
    });
  };
  const toggleProfileDropdown = (event?: React.MouseEvent) => {
    if (isProfileDropdownOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsProfileDropdownOpen(false);
        setIsClosing(false);
      }, 200); // Animation duration
    } else {
      setActiveDropdown(null); // Diğer dropdown'ı kapat
      setIsMobileMenuOpen(false); // Mobil menüyü kapat
      setIsProfileDropdownOpen(true);
    }
  };


  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    if (newState) {
      setActiveDropdown(null);
    } else {
      setMobileSubMenu(null);
    }
  };
  const handleMobileSubMenu = (targetMenuKey: string | null) => { // <<< BU FONKSİYON
  setMobileSubMenu(targetMenuKey);
};

const handleDownloadClick = () => {
    if (!isDownloadClicked) {
      setDownloadButtonText("Çok Yakında!");
      setIsDownloadClicked(true); // Buton tıklandı olarak işaretle
    
      setTimeout(() => {
        setDownloadButtonText("PrestiJ'i İndir");
        setIsDownloadClicked(false);
      }, 1000); 
    }
    // Eğer zaten "Çok Yakında!" ise bir şey yapma veya farklı bir aksiyon al (şimdilik bir şey yapmıyoruz)
  };

  const navLinksForDesktop: NavLinkItem[] = [ // İsmi değiştirdim, çakışmayı önlemek için
    { label: 'Oyunlar', href: '/oyunlar', dropdownId: 'oyunlarDropdown' },
    { label: 'Animeler', href: '/animeler', dropdownId: 'animelerDropdown' },
    { label: 'Kadromuz', href: '/kadromuz' },
    { label: 'Bize Katıl!', href: 'https://discord.gg/8Uh4yrXeBg' },
  ];

  if (session?.user) {
    navLinksForDesktop.splice(2, 0, {
        label: 'Kütüphanem', 
        href: `/profil/${session.user.username || session.user.id}?tab=library` 
    });
  }
  if (session?.user?.role === 'admin' && !isLoadingSession) {
    navLinksForDesktop.push({ label: 'Admin Paneli', href: '/admin' });
  }

  // Mobil Menü Ana Elemanları
  const getMobileMenuMainItems = (): MobileMenuItem[] => {
    const mainItems: MobileMenuItem[] = [
      { label: 'Oyunlar', action: 'submenu', target: 'gamesSubmenu', iconRight: <ChevronDownIcon className="h-4 w-4 text-prestij-text-muted" /> },
      { label: 'Animeler', action: 'submenu', target: 'animeSubmenu', iconRight: <ChevronDownIcon className="h-4 w-4 text-prestij-text-muted" /> },
    ];
    if (session?.user) {
      mainItems.push({ 
        label: 'Kütüphanem', 
        action: 'link', 
        href: `/profil/${session.user.username || session.user.id}?tab=library` 
      });
    }
    mainItems.push({ label: 'Kadromuz', action: 'link', href: '/kadromuz' });
    mainItems.push({ label: 'Bize Katıl!', action: 'link', href: 'https://discord.gg/8Uh4yrXeBg' });

    if (session?.user?.role === 'admin' && !isLoadingSession) {
      mainItems.push({ label: 'Admin Paneli', action: 'link', href: '/admin' });
    }
    return mainItems;
  };

  const mobileMenuData = {
    main: getMobileMenuMainItems(),
    gamesSubmenu: [
        ...(oyunlarDropdownContent.main as DropdownItem[]), // Tip ataması
        ...(oyunlarDropdownContent.favorites.map(item => ({ label: item.label, href: item.href, isAction: item.isAction })) as DropdownItem[])
    ],
    animeSubmenu: [
        ...(animelerDropdownContent.main as DropdownItem[]),
        ...(animelerDropdownContent.watchlist.map(item => ({ label: item.label, href: item.href, isAction: item.isAction })) as DropdownItem[])
    ],
  };
  const userProfileImageSrc = getCloudinaryImageUrlOptimized(
    session?.user?.profileImagePublicId, // Session'dan gelen public ID
    { width: 64, height: 64, crop: 'thumb', gravity: 'face', quality: 'auto' }, // Avatar için boyutlar
    'avatar' // Placeholder tipi (eğer ID yoksa /images/default-avatar.png döner)
  );
  console.log("Profile Image Public ID:", session?.user?.profileImagePublicId);
console.log("Final Profile Image URL:", userProfileImageSrc);

  const userBannerImageSrc = getCloudinaryImageUrlOptimized(
    session?.user?.bannerImagePublicId, // Session'dan gelen public ID
    { width: 300, height: 120, crop: 'fill', gravity: 'auto', quality: 'auto' }, // Dropdown banner için boyutlar
    'banner' // Placeholder tipi (eğer ID yoksa /images/default-banner.jpg döner)
  );


return (
    <header ref={headerRef} id="mainHeader" className="bg-prestij-bg-dark-1/60 sticky top-0 z-[1000] border-b border-prestij-border-primary min-h-header">
      {/* Ana sarmalayıcı DIV tam genişlikte, iç padding'i o kontrol edecek */}
      <div className="w-full px-4 sm:px-6 lg:px-8 h-full backdrop-brightness-[0.9] backdrop-blur-md">
          <div className="flex items-center justify-between h-full relative min-h-header py-1.5">
            {/* max-w-screen-xl (veya sizin 1250px'e denk gelen bir max-width sınıfı) içeriği ortalar ama kenarlara padding ana div'den gelir */}
            {/* VEYA max-w-screen-xl mx-auto kullanmayıp direkt justify-between ile elemanları kenarlara yaslayabilirsiniz */}

            {/* Mobil Menü ve Arama Butonları */}
<div className="flex items-center lg:hidden gap-2">
  {/* Mevcut menü butonu */}
  <button
    id="mobileMenuToggle"
    data-dropdown-toggle="false"
    className="text-prestij-text-accent hover:text-prestij-purple transition-colors p-2 -ml-2"
    onClick={toggleMobileMenu}
  >
    {isMobileMenuOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
  </button>

  {/* Yeni arama butonu */}
  <button
    className="text-prestij-text-accent hover:text-prestij-purple transition-colors p-2 -ml-2"
    onClick={openSearchOverlay}
  >
    <MagnifyingGlassIcon className="h-6 w-6" />
  </button>
</div>

            {/* Logo (Mobil için ortada, Desktop için solda) */}
            {/* Mobil'de logonun ortalanması için düzenleme */}
            <div className="absolute left-1/2 transform -translate-x-1/2 lg:static lg:transform-none lg:mr-auto">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/images/logo-placeholder.png" alt="PrestiJ Logo" width={50} height={50} className="h-[45px] sm:h-[50px] w-auto" />
                    <span className="site-name text-xl sm:text-2xl font-medium text-prestij-text-primary hidden sm:block">PrestiJ</span>
                </Link>
            </div>

            {/* Desktop Navigasyon ve Arama */}
            <div className="header-center hidden lg:flex items-center justify-center gap-6 mx-auto">
                <nav className="main-navigation">
                    <ul className="flex items-center gap-5">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                {link.dropdownId ? (
                                    <button
                                        data-dropdown-type="nav"
                                        data-dropdown-id={link.dropdownId!}
                                        data-dropdown-toggle="true"
                                        onClick={toggleDropdown(link.dropdownId!)}
                                        onMouseDown={(e) => e.preventDefault()} // Basılı tutmayı engelle
                                        className={`nav-link flex items-center gap-1.5 text-sm text-prestij-text-accent hover:text-prestij-purple transition-colors py-1.5 ${activeDropdown === link.dropdownId ? 'text-prestij-purple' : ''}`}
                                    >
                                        {link.label}
                                        {link.label === 'Kütüphanem' && <LibraryIconOutline className="h-3.5 w-3.5 ml-1" />}
                                        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${activeDropdown === link.dropdownId ? 'rotate-180' : ''}`} />
                                    </button>
                                ) : (
                                    <Link href={link.href} className="nav-link text-sm text-prestij-text-accent hover:text-prestij-purple transition-colors py-1.5">
                                        {link.label === 'Kütüphanem' && <LibraryIconOutline className="h-3.5 w-3.5 mr-1" />}
                                        {link.label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="search-area">
                    <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Arama Input'u */}
              <div className="relative group"> {/* Arama ikonunu input içine yerleştirmek için */}
                <input
  ref={searchInputRef}
  type="text"
  placeholder="İçerik Ara..."
  onFocus={handleHeaderSearchFocus}
  readOnly
  className="w-32 sm:w-48 md:w-40 py-2 pl-10 pr-4 
             text-sm text-prestij-text-input bg-prestij-bg-input/40 
             border border-prestij-border-input/60 rounded-full 
             focus:ring-2 focus:ring-prestij-purple focus:border-prestij-purple 
             outline-none transition-all duration-300 ease-in-out
             cursor-pointer group-hover:border-prestij-purple/70
             backdrop-blur-sm"
/>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-prestij-text-placeholder group-hover:text-prestij-purple/80 transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
              </div>

              </div>
                </div>
            </div>

            {/* Kullanıcı Aksiyonları (Sağda) */}
            <div className="user-actions flex items-center gap-3 sm:gap-4 lg:ml-auto">
                {/* Mesajlar İkonu */}
                {session?.user && ( // Sadece giriş yapmışsa göster
                    <Link href="/mesajlar" className="relative text-prestij-text-accent hover:text-prestij-purple transition-colors p-1.5 rounded-full hover:bg-prestij-purple/10">
                        <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <UnreadMessagesBadge />
                    </Link>
                )}
                {session?.user && ( // Sadece giriş yapmışsa göster
                    <NotificationBell />
                )}
                {isLoadingSession ? (
                    <div className="h-8 w-8 bg-prestij-bg-button/50 animate-pulse rounded-full"></div>
                ) : session?.user ? (
                    // Profil Avatarı ve Dropdown Tetiği
                    <div className="relative">
                        {/* Profil Dropdown container'ını güncelle */}
<div className="relative">
  <button
    data-dropdown-type="profile"
    onClick={toggleProfileDropdown}
    className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-prestij-bg-dark-1 focus:ring-prestij-purple"
  >
    <span className="sr-only">Kullanıcı menüsünü aç</span>
    <Image
      className="h-8 w-8 rounded-full object-cover"
      src={userProfileImageSrc}
      alt="Profil Fotoğrafı"
      width={32}
      height={32}
    />
  </button>

  {(isProfileDropdownOpen || isClosing) && (
    <div
                                ref={profileDropdownRef}
                                className={`origin-top absolute mt-2 w-60 rounded-lg shadow-xl bg-prestij-dropdown-bg ring-1 ring-prestij-dropdown-border-alt focus:outline-none overflow-hidden
                ${isClosing ? 'animate-dropdown-close' : 'animate-dropdown-open'}
                right-0 lg:left-1/2 lg:transform lg:-translate-x-1/2 // Konumlandırma animasyondan sonra
                `}
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="user-menu-button"
                                
                            >
      {/* Banner ve Profil Resmi Alanı */}
<div className="relative h-28 bg-gray-700"> 
    {/* Banner */}
    <Image
        src={userBannerImageSrc}
        alt="Banner"
        layout="fill"
        objectFit="cover"
        priority
    />
    
    {/* Ana karartma gradient'i */}
    <div 
        className="absolute inset-0" 
        style={{
            background: 'linear-gradient(to bottom,rgba(0, 0, 0, 0) 0%, rgba(13, 13, 13, 0.73) 60%, rgba(13,13,13,1) 100%)'
        }}
    />

    {/* Ek yumuşak geçiş için üst gradient */}
    <div 
        className="absolute inset-0" 
        style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, transparent 40%)'
        }}
    />

    {/* Profil resmi container'ı */}
    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative w-16 h-16">
                                            {/* Avatarın etrafına yumuşak bir glow/parlama için pseudo-element veya ek div kullanılabilir */}
                                            {/* Örnek: Basit bir box-shadow ile glow */}
                                            <div className="absolute inset-0 rounded-full opacity-0 group-hover/avatar:opacity-30 blur-md transition-opacity duration-300 animate-pulse-slow"></div>

                                            <Image
                                                className="h-16 w-16 rounded-full object-cover"
                                                src={userProfileImageSrc}
                                                alt="Profil"
                                                width={64}
                                                height={64}
                                                priority
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-3 px-4 pb-2 text-center mt-0">
                                    <p className="text-sm font-medium text-prestij-text-primary truncate">
                                        {session?.user?.name || session?.user?.email}
                                    </p>
                                </div>

                                {/* Kısa Ayırıcı Çizgi */}
                                <div className="px-4 my-1">
                                    <div className="h-px bg-prestij-divider-short"></div>
                                </div>

                                {/* Profil linki */}
<Link
    href={`/profil/${session.user.username || session.user.id}`}
    className="flex items-center px-4 py-2.5 text-sm text-prestij-text-secondary hover:bg-prestij-purple/10 hover:text-prestij-purple text-left transition-colors rounded-md mx-2 w-[calc(100%-16px)]" // w-[calc(100%-16px)] ve mx-2 ekledik
    role="menuitem"
    onClick={() => setIsProfileDropdownOpen(false)}
>
    <ProfileIcon className="mr-3 h-5 w-5" aria-hidden="true" />
    Profilim
</Link>

{/* Çıkış Yap butonu */}
<button
    onClick={() => { signOut(); setIsProfileDropdownOpen(false); }}
    className="flex items-center px-4 py-2.5 text-sm text-prestij-text-logout hover:bg-red-500/10 hover:text-red-400 text-left transition-colors rounded-md mx-2 mb-1 w-[calc(100%-16px)]"
    role="menuitem"
>
    <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" aria-hidden="true" />
    Çıkış Yap
</button>
                            </div>
                        )}
                </div>
                </div>
                ) : (
                    <Link
                        href="/giris"
                        className="btn bg-prestij-bg-button text-prestij-text-secondary border border-prestij-bg-button hover:bg-prestij-purple hover:border-prestij-purple hover:text-white text-xs sm:text-sm font-medium py-1.5 px-3 sm:px-4 rounded-md transition-colors whitespace-nowrap"
                    >
                        Giriş Yap
                    </Link>
                )}
                {/* "Prestij'i İndir" Butonu (Desktop için) */}
                <button 
                  onClick={handleDownloadClick}
                  disabled={isDownloadClicked} // Eğer tıklandıysa disable et
                  className={`btn hidden md:block text-xs sm:text-sm font-medium py-1.5 px-3 sm:px-4 rounded-md transition-colors whitespace-nowrap
                    ${isDownloadClicked 
                      ? 'bg-prestij-bg-button/50 text-prestij-text-muted cursor-not-allowed' // Soluk ve pasif stil
                      : 'bg-prestij-bg-button text-prestij-text-secondary border border-prestij-bg-button hover:bg-prestij-purple hover:border-prestij-purple hover:text-white' // Normal stil
                    }
                  `}
                >
                  {downloadButtonText}
                </button>
            </div>
          </div>
      </div>

      {/* Dropdown Overlay - Aktif dropdown varsa göster */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity duration-300 z-[900]"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* Dropdown Container */}
      <div ref={dropdownContainerRef} className="relative z-[901]"> {/* z-index arttırıldı */}
        {['oyunlarDropdown', 'animelerDropdown'].map(dropdownId => (
          <div
            key={dropdownId}
            id={dropdownId}
            className={`header-dropdown absolute top-0 left-0 w-full bg-prestij-bg-dark-4 shadow-header-dropdown 
                       transition-all duration-300 ease-out 
                       ${activeDropdown === dropdownId ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}`}
          >
              {/* Dropdown içeriği container ile sarmalanabilir veya direkt tam genişlikte olabilir */}
              <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8"> {/* Dropdown içeriği için padding */}
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
                      {dropdownId === 'oyunlarDropdown' && (
                          <>
                              <div className="dropdown-column flex-1">
                                  <h3 className="text-prestij-text-muted text-xs font-medium uppercase tracking-wider mb-3.5">OYUNLAR</h3>
                                  <ul>
                                      {oyunlarDropdownContent.main.map(item => (
                                          <li key={item.label} className="mb-1.5">
                                              <Link href={item.href} className="text-sm text-prestij-text-dropdown hover:text-prestij-purple transition-colors py-1 block">
                                                  {item.label}
                                              </Link>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                              <div className="dropdown-column flex-1">
                                  <h3 className="text-prestij-text-muted text-xs font-medium uppercase tracking-wider mb-3.5">FAVORİ OYUNLARIM</h3>
                                  <ul>
                                      {oyunlarDropdownContent.favorites.map((item: DropdownItem) => (
                                          <li key={item.label} className="mb-1.5">
                                              <Link href={item.href} className={`text-sm ${item.isAction ? 'italic text-prestij-text-muted hover:text-prestij-purple' : 'text-prestij-text-dropdown hover:text-prestij-purple'} transition-colors py-1 flex items-center gap-2`}>
                                                  {item.icon && <Image src={item.icon} alt="" width={24} height={24} className="rounded" />}
                                                  {item.label}
                                              </Link>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          </>
                      )}
                      {dropdownId === 'animelerDropdown' && (
                          <>
                              <div className="dropdown-column flex-1">
                                <h3 className="text-prestij-text-muted text-xs font-medium uppercase tracking-wider mb-3.5">ANİMELER</h3>
                                <ul>
                                  {(animelerDropdownContent.main as DropdownItem[]).map(item => (
                                    <li key={item.label} className="mb-1.5">
                                      <Link href={item.href} className="text-sm text-prestij-text-dropdown hover:text-prestij-purple transition-colors py-1 block">
                                        {item.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="dropdown-column flex-1">
                                <h3 className="text-prestij-text-muted text-xs font-medium uppercase tracking-wider mb-3.5">İZLEME LİSTEM</h3>
                                <ul>
                                  {(animelerDropdownContent.watchlist as DropdownItem[]).map(item => (
                                    <li key={item.label} className="mb-1.5">
                                      <Link href={item.href} className={`text-sm ${item.isAction ? 'italic text-prestij-text-muted hover:text-prestij-purple' : 'text-prestij-text-dropdown hover:text-prestij-purple'} transition-colors py-1 block`}>
                                        {item.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          </div>
        ))}
      </div>


      {/* Mobil Yan Panel */}
      <>
            {(isMobileMenuOpen || activeDropdown) && (
              <div
                className="fixed inset-0 bg-black/50 z-[990] lg:hidden"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setActiveDropdown(null);
                  setMobileSubMenu(null);
                }}
              />
            )}

            <div
                id="mobileSidePanel"
                ref={mobilePanelRef}
                className={`mobile-side-panel fixed top-0 left-0 w-full max-w-xs sm:max-w-sm h-full bg-prestij-bg-dark-1 shadow-xl z-[1001] transition-transform duration-300 ease-in-out lg:hidden border-r border-prestij-border-primary flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="panel-header p-4 flex justify-end items-center border-b border-prestij-border-primary">
                    <button onClick={toggleMobileMenu} className="text-prestij-text-accent hover:text-prestij-purple transition-colors p-1">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="panel-content p-4 flex-grow overflow-y-auto">
                    <nav>
                        <ul>
                            {mobileSubMenu === null && mobileMenuData.main.map((item: MobileMenuItem) => (
                                <li key={`mobile-main-${item.label}`} className="mb-0.5">
                                    {item.action === 'link' ? (
                                        <Link
                                            href={item.href}
                                            className="block w-full text-left py-3 px-3 text-prestij-text-secondary hover:bg-prestij-purple/10 hover:text-prestij-purple rounded-md transition-colors"
                                            onClick={toggleMobileMenu}
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => handleMobileSubMenu(item.target)} // handleMobileSubMenu kullanıldı
                                            className="w-full flex justify-between items-center py-3 px-3 text-prestij-text-secondary hover:bg-prestij-purple/10 hover:text-prestij-purple rounded-md transition-colors"
                                        >
                                            {item.label}
                                            {item.iconRight}
                                        </button>
                                    )}
                                </li>
                            ))}

                            {mobileSubMenu && (
                                <>
                                    <li>
                                        <button
                                            onClick={() => handleMobileSubMenu(null)} // Geri dön
                                            className="w-full flex items-center gap-2 py-3 px-3 text-prestij-text-secondary hover:bg-prestij-purple/10 hover:text-prestij-purple rounded-md transition-colors font-medium mb-2"
                                        >
                                            <ChevronLeftIcon className="h-5 w-5 text-prestij-text-muted" />
                                            Geri
                                        </button>
                                    </li>
                                    {/* mobileMenuData'dan alt menü elemanlarını doğru şekilde almalıyız */}
                                    {(mobileMenuData[mobileSubMenu as keyof typeof mobileMenuData] as DropdownItem[]).map((subItem: DropdownItem) => (
                                        <li key={`mobile-sub-${subItem.label}`} className="mb-0.5">
                                            <Link
                                                href={subItem.href}
                                                className={`block py-3 px-3 rounded-md transition-colors ${subItem.isAction ? 'text-prestij-purple italic font-medium' : 'text-prestij-text-secondary'} hover:bg-prestij-purple/10 hover:text-prestij-purple`}
                                                onClick={toggleMobileMenu}
                                            >
                                                {subItem.label}
                                            </Link>
                                        </li>
                                    ))}
                                </>
                            )}
                        </ul>
                        {/* Giriş/Çıkış ve İndir Butonları */}
                        {mobileSubMenu === null && (
                            <div className="mt-6 pt-4 border-t border-prestij-border-primary space-y-2">
                                 {isLoadingSession ? (
                                    <div className="h-10 bg-prestij-bg-button/50 animate-pulse rounded-md mb-2"></div>
                                 ) : session?.user ? (
                                    <button
                                        onClick={() => { signOut(); toggleMobileMenu(); }}
                                        className="block w-full text-center py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors font-medium"
                                    >
                                        Çıkış Yap
                                    </button>
                                 ) : (
                                    <Link
                                        href="/giris"
                                        className="block w-full text-center py-2.5 px-4 bg-prestij-bg-button text-prestij-text-secondary border border-prestij-bg-button hover:bg-prestij-purple hover:border-prestij-purple hover:text-white rounded-md transition-colors font-medium"
                                        onClick={toggleMobileMenu}
                                    >
                                        Giriş Yap
                                    </Link>
                                 )}
                                <button // Link yerine button kullandım, onClick ile handleDownloadClick'i çağırabiliriz
                onClick={() => {
                    handleDownloadClick(); // Ana fonksiyonu çağır
                    // toggleMobileMenu(); // Menüyü kapatmak isteyebilirsin
                }}
                disabled={isDownloadClicked}
                className={`block w-full text-center py-2.5 px-4 rounded-md transition-colors font-medium
                    ${isDownloadClicked
                        ? 'bg-prestij-bg-button/30 text-prestij-text-muted cursor-not-allowed' // Mobil için biraz daha farklı soluk stil olabilir
                        : 'bg-prestij-bg-button text-prestij-text-secondary border border-prestij-bg-button hover:bg-prestij-purple hover:border-prestij-purple hover:text-white'
                    }
                `}
            >
                {downloadButtonText}
            </button>
                            </div>
                        )}
                    </nav>
                </div>
            </div>
            <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={closeSearchOverlay} 
        // initialSearchTerm={searchInputRef.current?.value} // İsteğe bağlı: Header'daki terimi overlay'e aktar
      />
        </>
    </header>
  );
};

export default Header;