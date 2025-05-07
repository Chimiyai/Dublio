'use client';

import { useState, FormEvent, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react'; // useSession'ı import et
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function GirisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession(); // Oturum durumunu al

  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sayfa yüklendiğinde veya oturum durumu değiştiğinde çalışır
  useEffect(() => {
    // Eğer kullanıcı zaten giriş yapmışsa ve bu sayfaya gelmişse
    if (status === 'authenticated') {
      console.log("Giriş sayfasında zaten giriş yapılmış, yönlendiriliyor:", callbackUrl);
      router.replace(callbackUrl); // Ana sayfaya veya callbackUrl'e yönlendir
    }
  }, [status, router, callbackUrl]); // Bağımlılıkları ekle

  useEffect(() => {
    if (errorParam && status !== 'authenticated') { // Sadece giriş yapılmamışsa hatayı göster
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('E-posta veya şifre hatalı.');
          break;
        case 'Callback':
           // Bu hata genellikle OAuth sağlayıcılarıyla ilgilidir veya middleware yanlış yönlendirdiğinde.
           // Middleware callbackUrl'i düzgün ayarladığı için buraya düşmemeli.
          setError('Giriş sırasında bir yönlendirme hatası oluştu. Lütfen tekrar deneyin.');
          break;
        default:
          setError(`Bir hata oluştu. (${errorParam})`);
      }
    }
  }, [errorParam, status]);


  const handleSubmit = async (e: FormEvent) => {
    // ... (handleSubmit içeriği aynı kalabilir) ...
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: password,
      });

      console.log('signIn sonucu:', result);

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
            setError('E-posta veya şifre hatalı.');
        } else {
           setError(`Giriş hatası: ${result.error}`);
        }
        setIsLoading(false);
      } else if (result?.ok && !result?.error) {
        console.log('Giriş başarılı, yönlendiriliyor:', callbackUrl);
        // router.push(callbackUrl); // push yerine replace daha iyi olabilir
        router.replace(callbackUrl); // Tarayıcı geçmişinde giriş sayfasını bırakmaz
        router.refresh();
      } else {
         setError('Giriş sırasında bilinmeyen bir hata oluştu.');
         setIsLoading(false);
      }
    } catch (err) {
      console.error("signIn fonksiyonu hatası:", err);
      setError('Giriş işlemi sırasında bir hata oluştu.');
      setIsLoading(false);
    }
  };

  // Eğer oturum yükleniyorsa veya zaten giriş yapılmışsa formu gösterme (isteğe bağlı)
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Yönlendiriliyor...</p>
      </div>
    );
  }

  // Sadece giriş yapılmamışsa formu göster
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 shadow-md rounded-lg w-full max-w-md">
        {/* ... (form içeriği aynı kalabilir) ... */}
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Giriş Yap</h1>
        <form onSubmit={handleSubmit}>
          {error && <p className="mb-4 text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
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
          </div>
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