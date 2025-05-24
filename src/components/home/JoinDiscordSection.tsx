// src/components/home/JoinDiscordSection.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link'; // Next.js Link component'i

const JoinDiscordSection = () => {
  const discordInviteLink = "YOUR_DISCORD_INVITE_LINK_HERE"; // GERÇEK LİNKİNİZİ BURAYA YAZIN

  return (
    <section className="join-discord-section bg-discord-section-bg py-12 md:py-16 text-center"> {/* hero-bg veya tanımladığınız discord-section-bg */}
      <div className="container mx-auto discord-cta-container relative z-[1] flex flex-col items-center px-4">
        <h2 className="section-title discord-main-title text-2xl sm:text-3xl md:text-4xl font-semibold text-prestij-text-primary mb-8 text-shadow-discord-title">
          Sende Mi Dublaj Yapmak İstiyorsun?
        </h2>
        <Link
          href={discordInviteLink}
          target="_blank" // Yeni sekmede açar
          rel="noopener noreferrer" // Güvenlik için
          className="discord-banner-link inline-block rounded-lg overflow-hidden 
                     transition-all duration-250 ease-out 
                     hover:scale-105 hover:shadow-discord-banner-hover focus-visible:ring-2 focus-visible:ring-prestij-purple focus-visible:ring-offset-2 focus-visible:ring-offset-hero-bg"
        >
          <Image
            src="/images/discord-banner.png" // Bu imajın public/images altında olduğundan emin olun
            alt="Ekip Alımlarını Discord Üzerinden Yapıyoruz!"
            width={650} // Orijinal max-width'e göre
            height={185} // Genişliğe göre orantılı bir yükseklik (örneğin, 650x185)
                        // Gerçek resminizin en-boy oranına göre ayarlayın
            className="discord-banner-image block max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-[650px] w-full h-auto rounded-md"
            // style={{ aspectRatio: '650 / 185' }} // İsteğe bağlı olarak en-boy oranını korumak için
          />
        </Link>
        {/* 
          İsteğe bağlı olarak PNG üzerindeki "Ekip Alımlarını Discord Üzerinden Yapıyoruz!"
          yazısını HTML ile ekleyip CSS ile PNG üzerine konumlandırabiliriz
          eğer PNG'de bu yazı yoksa. Şimdilik PNG'de olduğunu varsayıyorum.
        */}
      </div>
    </section>
  );
};

export default JoinDiscordSection;