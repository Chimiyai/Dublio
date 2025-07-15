// src/app/gizlilik-politikasi/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | Dublio',
  description: 'Dublio olarak kullanıcı gizliliğine verdiğimiz önem ve kişisel verilerinizi nasıl işlediğimiz hakkında bilgi edinin.',
  robots: 'noindex, nofollow',
};

export default function GizlilikPolitikasiPage() {
  return (
    <div className="bg-dublio-dark-900 text-dublio-text-primary min-h-screen py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <article className="prose prose-lg dark:prose-invert max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 border-b border-dublio-border-dark pb-4">
            Gizlilik Politikası
          </h1>

          <p className="text-sm text-dublio-text-muted mb-6">
            Son Güncelleme: [31.05.2025]
          </p>

          <section className="space-y-4">
            <h2>1. Topladığımız Bilgiler</h2>
            <p>
              Dublio olarak, hizmetlerimizi sunmak ve geliştirmek amacıyla bazı kişisel bilgilerinizi toplayabiliriz. Bu bilgiler şunları içerebilir:
            </p>
            <ul>
              <li><strong>Kayıt Bilgileri:</strong> Siteye üye olurken verdiğiniz kullanıcı adı, e-posta adresi, şifre (hash'lenmiş olarak saklanır).</li>
              <li><strong>Profil Bilgileri:</strong> Opsiyonel olarak eklediğiniz biyografi, profil resmi, banner resmi.</li>
              <li><strong>Etkileşim Bilgileri:</strong> Yaptığınız yorumlar, verdiğiniz puanlar, favorilerinize eklediğiniz içerikler, dublaj istekleri.</li>
              <li><strong>Kullanım Verileri:</strong> Siteyi ziyaret ettiğinizde IP adresiniz, tarayıcı türünüz, ziyaret ettiğiniz sayfalar, sitede geçirdiğiniz süre gibi anonimleştirilmiş teknik veriler.</li>
            </ul>

            <h2>2. Bilgilerin Kullanımı</h2>
            <p>
              Topladığımız bilgileri aşağıdaki amaçlar için kullanırız:
            </p>
            <ul>
              <li>Size hizmetlerimizi sunmak ve kullanıcı deneyiminizi kişiselleştirmek.</li>
              <li>Hesabınızı yönetmek ve sizinle iletişim kurmak.</li>
              <li>Site'nin güvenliğini sağlamak ve kötüye kullanımı önlemek.</li>
              <li>Hizmetlerimizi analiz etmek ve geliştirmek.</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek.</li>
            </ul>

            <h2>3. Bilgilerin Paylaşımı</h2>
            <p>
              Kişisel bilgilerinizi sizin onayınız olmadan üçüncü taraflarla pazarlama amacıyla paylaşmayız. Ancak, aşağıdaki durumlarda bilgileriniz paylaşılabilir:
            </p>
            <ul>
              <li>Yasal bir zorunluluk olması durumunda (mahkeme kararı vb.).</li>
              <li>Hizmet sağlayıcılarımızla (örn: hosting, e-posta gönderimi), ancak sadece hizmetlerini yerine getirebilmeleri için gerekli ölçüde ve gizlilik anlaşmaları çerçevesinde.</li>
              <li>Şirketimizin birleşmesi, devralınması veya varlıklarının satılması durumunda.</li>
            </ul>

            <h2>4. Çerezler (Cookies)</h2>
            <p>
              Sitemiz, kullanıcı deneyimini geliştirmek ve site trafiğini analiz etmek amacıyla çerezler kullanabilir. Tarayıcı ayarlarınızdan çerezleri reddedebilirsiniz,
              ancak bu durumda Site'nin bazı özelliklerinin düzgün çalışmayabileceğini unutmayın.
            </p>
            
            <h2>5. Veri Güvenliği</h2>
            <p>
              Kişisel bilgilerinizin güvenliğini sağlamak için makul teknik ve idari önlemler almaktayız. Ancak, internet üzerinden hiçbir veri aktarımının %100 güvenli olmadığını lütfen unutmayın.
            </p>

            <h2>6. Çocukların Gizliliği</h2>
            <p>
              Sitemiz 13 yaşın altındaki çocuklara yönelik değildir ve bilerek onlardan kişisel bilgi toplamayız.
            </p>

            <h2>7. Haklarınız</h2>
            <p>
              Kişisel verilerinizle ilgili olarak erişme, düzeltme, silme ve işlenmesine itiraz etme gibi haklarınız bulunmaktadır. Bu haklarınızı kullanmak için
              lütfen bizimle iletişime geçin.
            </p>
            
            <h2>8. Politika Değişiklikleri</h2>
            <p>
              Bu Gizlilik Politikası'nı zaman zaman güncelleyebiliriz. Değişiklikler Site'de yayınlandığı anda yürürlüğe girer.
            </p>

            <h2>9. İletişim</h2>
            <p>
              Gizlilik Politikamız ile ilgili sorularınız için lütfen <a href="mailto:gizlilik@dubliostudio.com" className="text-dublio-400 hover:underline">gizlilik@dubliodublaj.com</a> adresinden bize ulaşın.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}