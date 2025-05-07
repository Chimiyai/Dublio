'use client';

import { useState, FormEvent, useEffect } from 'react'; // useEffect'i import et
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // useSession'ı import et

export default function KayitPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); // Oturum durumunu al

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sayfa yüklendiğinde veya oturum durumu değiştiğinde çalışır
  useEffect(() => {
    // Eğer kullanıcı zaten giriş yapmışsa ve bu sayfaya gelmişse
    if (status === 'authenticated') {
      console.log("Kayıt sayfasında zaten giriş yapılmış, ana sayfaya yönlendiriliyor.");
      router.replace('/'); // Ana sayfaya yönlendir
    }
  }, [status, router]); // Bağımlılıkları ekle

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }

      setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => {
        router.push('/giris');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Eğer oturum yükleniyorsa veya zaten giriş yapılmışsa formu gösterme
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Yönlendiriliyor...</p>
      </div>
    );
  }

  // Sadece giriş yapılmamışsa kayıt formunu göster
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 shadow-md rounded-lg w-full max-w-md">
        {/* ... (form içeriği aynı kalabilir) ... */}
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">Hesap Oluştur</h1>
        <form onSubmit={handleSubmit}>
          {error && <p className="mb-4 text-red-500 dark:text-red-400 text-sm">{error}</p>}
          {success && <p className="mb-4 text-green-500 dark:text-green-400 text-sm">{success}</p>}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="username">
              Kullanıcı Adı
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              id="username"
              type="text"
              placeholder="Kullanıcı Adınız"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading || !!success}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              E-posta
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              id="email"
              type="email"
              placeholder="eposta@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || !!success}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Şifre
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading || !!success}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">En az 6 karakter olmalı.</p>
          </div>
          <div className="flex items-center justify-between">
            <button
              className={`bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading || !!success ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={isLoading || !!success}
            >
              {isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </button>
            <Link href="/giris" className="inline-block align-baseline font-bold text-sm text-blue-500 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              Zaten hesabın var mı? Giriş Yap
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}