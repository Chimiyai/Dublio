// src/components/home/JoinDiscordSection.tsx
import Link from 'next/link';
import Image from 'next/image';

interface JoinDiscordSectionProps {
  title: string;
  bannerImageUrl: string;
  discordInviteLink: string;
}

export default function JoinDiscordSection({ title, bannerImageUrl, discordInviteLink }: JoinDiscordSectionProps) {
  return (
    <section className="join-discord-section bg-secondary-dark py-12 md:py-16 text-center relative">
      {/* Üst ayraç çizgisi (Opsiyonel) */}
      {/* <div className="section-divider top-divider absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-screen-lg h-px bg-gray-700/50 opacity-50"></div> */}
      
      <div className="container discord-cta-container mx-auto relative z-[1] flex flex-col items-center">
        <h2 className="section-title discord-main-title text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 mb-8 shadow-sm">
          {title}
        </h2>
        <Link
          href={discordInviteLink}
          target="_blank"
          rel="noopener noreferrer"
          className="discord-banner-link group inline-block rounded-lg overflow-hidden transition-all duration-250 ease-out hover:scale-103 hover:shadow-2xl hover:shadow-text-brand-purple/30"
        >
          <Image
            src={bannerImageUrl}
            alt="Ekip Alımlarını Discord Üzerinden Yapıyoruz!"
            width={650} // Orjinal resmin en boy oranına göre ayarla
            height={200} // Orjinal resmin en boy oranına göre ayarla
            className="discord-banner-image max-w-full h-auto sm:max-w-md md:max-w-lg lg:max-w-xl rounded-md"
          />
        </Link>
      </div>
    </section>
  );
}