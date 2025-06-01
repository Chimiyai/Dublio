// src/app/kullanim-kosullari/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları | PrestiJ Studio',
  description: 'PrestiJ Studio web sitesi ve hizmetlerinin kullanım koşulları.',
  robots: 'noindex, nofollow', // Genellikle bu tür sayfaların arama motorları tarafından indekslenmesi istenmez
};

export default function KullanimKosullariPage() {
  return (
    <div className="bg-prestij-dark-900 text-prestij-text-primary min-h-screen py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <article className="prose prose-lg dark:prose-invert max-w-3xl mx-auto"> {/* prose class'ları metin formatlaması için */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 border-b border-prestij-border-dark pb-4">
            Kullanım Koşulları
          </h1>

          <p className="text-sm text-prestij-text-muted mb-6">
            Son Güncelleme: [31.05.2025] {/* Bu tarihi güncelleyin */}
          </p>

          <section className="space-y-4">
            <h2>1. Kabul Edilen Şartlar</h2>
            <p>
              Bu web sitesini ("Site") ziyaret ederek veya kullanarak, işbu Kullanım Koşulları'nı ("Koşullar") kabul etmiş sayılırsınız.
              Eğer bu Koşulları kabul etmiyorsanız, lütfen Site'yi kullanmayınız. PrestiJ Studio ("Biz", "Şirket") bu Koşulları zaman zaman güncelleme hakkını saklı tutar.
            </p>

            <h2>2. Hizmetlerin Açıklaması</h2>
            <p>
              PrestiJ Studio, kullanıcılara Türkçe dublajlı oyun ve anime içerikleri hakkında bilgi sunan, bu içeriklere etkileşimde bulunma (puan verme, yorum yapma vb.)
              ve dublaj isteklerinde bulunma imkanı sağlayan bir platformdur.
            </p>

            <h2>3. Kullanıcı Davranışları</h2>
            <p>
              Siteyi kullanırken yasalara ve genel ahlak kurallarına uymayı kabul edersiniz. Aşağıdaki davranışlar yasaktır:
            </p>
            <ul>
              <li>Yasadışı, zararlı, tehditkar, taciz edici, küfürlü içerikler yayınlamak.</li>
              <li>Başka bir kişinin kimliğine bürünmek veya yanlış bilgi vermek.</li>
              <li>Site'nin altyapısına zarar verecek veya aşırı yük bindirecek eylemlerde bulunmak.</li>
              <li>İstenmeyen ticari mesajlar (spam) göndermek.</li>
            </ul>

            <h2>4. Fikri Mülkiyet Hakları</h2>
            <p>
              Site'de yer alan tüm içerikler (metinler, görseller, logolar, dublajlar vb.) PrestiJ Studio'ya veya ilgili hak sahiplerine aittir ve
              Türk ve uluslararası telif hakkı yasalarıyla korunmaktadır. İzinsiz kullanımı yasaktır.
            </p>
            
            <h2>5. Sorumluluğun Reddi</h2>
            <p>
              Site "olduğu gibi" sunulmaktadır. İçeriklerin doğruluğu, güncelliği veya kesintisiz erişilebilirliği konusunda herhangi bir garanti vermemekteyiz.
              Siteyi kullanımınızdan doğabilecek doğrudan veya dolaylı zararlardan sorumlu tutulamayız.
            </p>

            <h2>6. Üçüncü Taraf Bağlantıları</h2>
            <p>
              Site, üçüncü taraf web sitelerine bağlantılar içerebilir. Bu sitelerin içeriklerinden veya gizlilik uygulamalarından sorumlu değiliz.
            </p>

            <h2>7. Koşulların Değiştirilmesi</h2>
            <p>
              Bu Kullanım Koşulları'nı zaman zaman değiştirme hakkımız saklıdır. Değişiklikler Site'de yayınlandığı anda yürürlüğe girer.
              Siteyi kullanmaya devam etmeniz, güncellenmiş Koşulları kabul ettiğiniz anlamına gelir.
            </p>

            <h2>8. İletişim</h2>
            <p>
              Kullanım Koşulları ile ilgili sorularınız için lütfen <a href="mailto:iletisim@prestijstudio.com" className="text-prestij-400 hover:underline">iletisim@prestijdublaj.com</a> adresinden bize ulaşın.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}