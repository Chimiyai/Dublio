// src/app/(auth)/giris/page.tsx
'use client'; // Form etkileşimi, state, router ve signIn için Client Component

import { useState, FormEvent, useEffect } from 'react';
import { signIn } from 'next-auth/react'; // NextAuth'un giriş fonksiyonu
import { useRouter, useSearchParams } from 'next/navigation'; // Yönlendirici ve URL parametreleri
import Link from 'next/link';

export default function GirisPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // URL'deki query parametrelerini okumak için

  // Eğer başka bir sayfadan giriş yapılması gerektiği için yönlendirildiyse,
  // o sayfanın URL'si 'callbackUrl' parametresinde gelir. Giriş sonrası oraya döneriz.
  // Yoksa ana sayfaya ('/') yönlendiririz.
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  // NextAuth'un ?error=... şeklinde gönderdiği hata mesajlarını almak için
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Bizim form özelindeki hatalar
  const [isLoading, setIsLoading] = useState(false);

  // URL'den gelen NextAuth hatalarını state'e aktaralım (sadece bir kere)
  useEffect(() => {
    if (errorParam) {
      // NextAuth'un genel hata kodlarını daha anlaşılır mesajlara çevirebiliriz
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('E-posta veya şifre hatalı.');
          break;
        case 'Callback':
          setError('Giriş sırasında bir yönlendirme hatası oluştu.');
          break;
        default:
          setError(`Bir hata oluştu: ${errorParam}`);
      }
      // Hata mesajını gösterdikten sonra URL'den temizleyebiliriz (isteğe bağlı)
      // router.replace('/giris', undefined); // Bu bazen sorun çıkarabilir
    }
  }, [errorParam]); // Sadece errorParam değiştiğinde çalışır


  // Form gönderildiğinde çalışacak fonksiyon
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Önceki form hatalarını temizle

    try {
      // NextAuth'un signIn fonksiyonunu çağırıyoruz
      const result = await signIn('credentials', {
        // Hangi provider'ı kullanacağımızı belirtiyoruz ('credentials' -> CredentialsProvider)
        // redirect: false -> Giriş sonucunu kendimiz işlemek istiyoruz, NextAuth otomatik yönlendirmesin.
        // Eğer true yapsaydık, başarılı girişte callbackUrl'e, başarısızda error sayfasına yönlendirirdi.
        redirect: false,
        email: email,       // credentials.email olarak authorize fonksiyonuna gidecek
        password: password,   // credentials.password olarak authorize fonksiyonuna gidecek
        // callbackUrl: callbackUrl // redirect:true ise nereye yönlendirileceğini belirtir
      });

      console.log('signIn sonucu:', result); // Geliştirme için log

      // Giriş başarısız olduysa (authorize null döndüyse veya başka bir hata olduysa)
      if (result?.error) {
        // result.error genellikle 'CredentialsSignin' gibi bir kod içerir.
        if (result.error === 'CredentialsSignin') {
            setError('E-posta veya şifre hatalı.');
        } else {
           // Diğer olası NextAuth hataları
           setError(`Giriş hatası: ${result.error}`);
        }
        setIsLoading(false); // Yüklenmeyi durdur
      } else if (result?.ok && !result?.error) {
        // Giriş başarılı (result.ok true ve error yoksa)
        console.log('Giriş başarılı, yönlendiriliyor:', callbackUrl);
        // Başarılı giriş sonrası kullanıcıyı hedef URL'ye yönlendir
        // setIsLoading(false) demeye gerek yok, sayfa değişecek.
        router.push(callbackUrl);
        router.refresh(); // Sayfanın yenilenmesini sağlayarak session bilgisinin güncellenmesini tetikle (önerilir)
      } else {
         // Beklenmedik bir durum
         setError('Giriş sırasında bilinmeyen bir hata oluştu.');
         setIsLoading(false);
      }

    } catch (err) {
      // signIn fonksiyonu çağrılırken bir hata olursa (genellikle olmaz ama)
      console.error("signIn fonksiyonu hatası:", err);
      setError('Giriş işlemi sırasında bir hata oluştu.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Giriş Yap</h1>
        <form onSubmit={handleSubmit}>
          {/* Hata Mesajı Alanı */}
          {error && <p className="mb-4 text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

          {/* E-posta Girişi */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              E-posta
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              id="email"
              type="email"
              placeholder="eposta@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Şifre Girişi */}
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Şifre
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {/* Şifremi unuttum linki eklenebilir */}
          </div>

          {/* Butonlar ve Link */}
          <div className="flex items-center justify-between">
            <button
              className={`bg-green-500 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
            <Link href="/kayit" className="inline-block align-baseline font-bold text-sm text-blue-500 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              Hesabın yok mu? Kayıt Ol
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}