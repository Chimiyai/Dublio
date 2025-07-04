// src/app/hakkimizda/page.tsx
import { Metadata } from 'next';
import Image from 'next/image'; // Veya NextImage alias'ınız
import Link from 'next/link';
import { UsersIcon, LightBulbIcon, RocketLaunchIcon, HeartIcon } from '@heroicons/react/24/outline'; // Örnek ikonlar

export const metadata: Metadata = {
  title: 'Hakkımızda | PrestiJ Studio',
  description: 'PrestiJ Studio olarak misyonumuz, vizyonumuz ve Türkçe dublaj dünyasına getirdiğimiz yenilikler hakkında daha fazla bilgi edinin.',
};

export default function HakkimizdaPage() {
  return (
    <div className="bg-prestij-dark-900 text-prestij-text-primary min-h-screen">
      {/* Hero/Başlık Bölümü */}
      <div className="relative bg-prestij-sidebar-bg/30 py-20 sm:py-28 lg:py-32">
        {/* Arka plan görseli veya deseni (opsiyonel) */}
        {/* <Image src="/images/hakkimizda-banner.jpg" alt="Hakkımızda Banner" layout="fill" objectFit="cover" className="opacity-20" /> */}
        <div className="absolute inset-0 bg-gradient-to-b from-prestij-dark-900/50 via-prestij-dark-900/80 to-prestij-dark-900"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            PrestiJ Studio Hakkında
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-8 text-prestij-text-secondary max-w-3xl mx-auto">
            Tutkuyla hazırladığımız Türkçe dublajlarla oyun ve anime dünyasına yeni bir soluk getiriyoruz. Kaliteli içerik ve güçlü bir topluluk için buradayız!
          </p>
        </div>
      </div>

      {/* Ana İçerik Bölümü */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12 md:space-y-16">

          {/* Misyonumuz Bölümü */}
          <section>
            <div className="flex items-center mb-4">
              <LightBulbIcon className="h-8 w-8 text-prestij-400 mr-3 flex-shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">Misyonumuz</h2>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none text-prestij-text-secondary leading-relaxed space-y-4">
              <p>
                PrestiJ Studio olarak ana misyonumuz, Türkiye'deki oyun ve anime severlere en yüksek kalitede, duyguyu tam anlamıyla yansıtan ve orijinaline sadık Türkçe dublaj deneyimleri sunmaktır. Dil bariyerlerini ortadan kaldırarak, herkesin bu harika dünyalara kendi dilinde tam erişim sağlamasını hedefliyoruz.
              </p>
              <p>
                Yetenekli seslendirme sanatçılarımız, çevirmenlerimiz ve teknik ekibimizle, her projeye özgün bir ruh katmak ve izleyici/oyuncu kitlesiyle derin bir bağ kurmak için çalışıyoruz.
              </p>
            </div>
          </section>

          {/* Vizyonumuz Bölümü */}
          <section>
            <div className="flex items-center mb-4">
              <RocketLaunchIcon className="h-8 w-8 text-prestij-400 mr-3 flex-shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">Vizyonumuz</h2>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none text-prestij-text-secondary leading-relaxed space-y-4">
              <p>
                Türkiye'de Türkçe dublaj standartlarını yeniden tanımlayan, yenilikçi ve öncü bir stüdyo olmak. Sadece mevcut içerikleri yerelleştirmekle kalmayıp, aynı zamanda dublaj sanatına ve bu alandaki yeteneklere yatırım yaparak sektörün gelişimine katkıda bulunmayı amaçlıyoruz.
              </p>
              <p>
                Gelecekte, interaktif dublaj deneyimleri, topluluk odaklı projeler ve uluslararası iş birlikleri ile PrestiJ Studio'yu global bir marka haline getirmeyi hayal ediyoruz.
              </p>
            </div>
          </section>

          {/* Hikayemiz Bölümü (Opsiyonel) */}
          <section>
            <div className="flex items-center mb-4">
              {/* Örnek ikon, istersen değiştir */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-prestij-400 mr-3 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">Hikayemiz</h2>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none text-prestij-text-secondary leading-relaxed space-y-4">
              <p>
                PrestiJ Studio, 4 Şubat 2025 tarihinde, Rüzgar Orhan Yozğat ve Efe Coşkun tarafından, Türkiye'deki dublaj kalitesini bir üst seviyeye taşıma hayaliyle kuruldu. Küçük bir ekip ve büyük bir tutkuyla başlayan yolculuğumuz, zamanla büyüyerek bugünkü yüksek noktalara ulaştı.
              </p>
            </div>
          </section>

          {/* Ekibe Çağrı */}
          <section className="text-center py-10">
            <UsersIcon className="h-12 w-12 text-prestij-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
              Bu Heyecana Ortak Olun!
            </h2>
            <p className="text-prestij-text-secondary max-w-xl mx-auto mb-6">
              Dublaj dünyasına tutkuyla bağlıysanız ve yeteneklerinize güveniyorsanız, siz de PrestiJ Studio ailesinin bir parçası olabilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                    href="/kadromuz" // Kadromuz sayfasına link
                    className="inline-block bg-transparent hover:bg-prestij-500/10 text-prestij-300 hover:text-prestij-200 border border-prestij-500/50 hover:border-prestij-500 px-8 py-3 rounded-lg text-base font-medium transition-colors"
                >
                    Ekibimizi Gör
                </Link>
                <Link
                    href="https://discord.gg/9hX4GJtEsX" // Bize Katıl sayfasına link
                    className="inline-block bg-prestij-500 hover:bg-prestij-600 text-white px-8 py-3 rounded-lg text-base font-medium transition-colors shadow-lg hover:shadow-xl"
                >
                    Bize Katıl!
                </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}