// src/app/(auth)/kayit/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Yönlendirme için
// İkonlar için (örneğin input alanlarında)
// import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function KayitPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.');
        setIsLoading(false);
        return;
    }

    try {
      const res = await fetch('/api/register', { // Kayıt API endpoint'iniz
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (res.ok) {
        // Başarılı kayıt sonrası kullanıcıyı giriş sayfasına yönlendirebilir veya
        // bir başarı mesajı gösterebiliriz.
        router.push('/giris?kayit=basarili'); // veya /profil
      } else {
        const data = await res.json();
        setError(data.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      console.error(err);
      setError('Bir ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tailwind config'inizde 'prestij-' ön ekli renklerin tanımlı olduğundan emin olun.
  // Örneğin: 'prestij-purple', 'prestij-bg-dark-1', 'prestij-bg-dark-4', 'prestij-border-secondary', 'prestij-text-primary', 'prestij-text-muted'

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-prestij-bg-dark-1 shadow-xl rounded-lg">
      {/* Üst Logo veya Başlık Alanı */}
      <div className="text-center">
        {/* <Image src="/images/logo-placeholder.png" alt="PrestiJ Logo" width={80} height={80} className="mx-auto mb-4" /> */}
        <h1 className="text-3xl font-bold text-prestij-text-primary">
          Hesap Oluştur
        </h1>
        <p className="mt-2 text-prestij-text-muted">
          PrestiJ dünyasına katılın!
        </p>
      </div>

      {/* Kayıt Formu */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kullanıcı Adı */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-prestij-text-secondary mb-1">
            Kullanıcı Adı
          </label>
          <div className="relative">
            {/* <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /> */}
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none block w-full pl-3 pr-3 py-2.5 bg-prestij-bg-dark-4 border border-prestij-border-secondary rounded-md shadow-sm placeholder-prestij-text-placeholder focus:outline-none focus:ring-2 focus:ring-prestij-purple focus:border-prestij-purple sm:text-sm text-prestij-text-primary"
              placeholder="Kullanıcı adınız"
            />
          </div>
        </div>

        {/* E-posta */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-prestij-text-secondary mb-1">
            E-posta Adresi
          </label>
          <div className="relative">
            {/* <EnvelopeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /> */}
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full pl-3 pr-3 py-2.5 bg-prestij-bg-dark-4 border border-prestij-border-secondary rounded-md shadow-sm placeholder-prestij-text-placeholder focus:outline-none focus:ring-2 focus:ring-prestij-purple focus:border-prestij-purple sm:text-sm text-prestij-text-primary"
              placeholder="ornek@mail.com"
            />
          </div>
        </div>

        {/* Şifre */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-prestij-text-secondary mb-1">
            Şifre
          </label>
          <div className="relative">
            {/* <LockClosedIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /> */}
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full pl-3 pr-10 py-2.5 bg-prestij-bg-dark-4 border border-prestij-border-secondary rounded-md shadow-sm placeholder-prestij-text-placeholder focus:outline-none focus:ring-2 focus:ring-prestij-purple focus:border-prestij-purple sm:text-sm text-prestij-text-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-400 hover:text-prestij-purple"
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {/* {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />} */}
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i> {/* Font Awesome kullandığımızı varsayarsak */}
            </button>
          </div>
        </div>

        {/* Şifre Tekrar */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-prestij-text-secondary mb-1">
            Şifreyi Tekrarla
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full pl-3 pr-10 py-2.5 bg-prestij-bg-dark-4 border border-prestij-border-secondary rounded-md shadow-sm placeholder-prestij-text-placeholder focus:outline-none focus:ring-2 focus:ring-prestij-purple focus:border-prestij-purple sm:text-sm text-prestij-text-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-400 hover:text-prestij-purple"
              aria-label={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        {/* Hata Mesajı Alanı */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Kayıt Ol Butonu */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-prestij-purple hover:bg-prestij-purple-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prestij-purple disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Kayıt Ol'
            )}
          </button>
        </div>
      </form>

      {/* Giriş Sayfasına Yönlendirme */}
      <p className="mt-8 text-center text-sm text-prestij-text-muted">
        Zaten bir hesabın var mı?{' '}
        <Link href="/giris" className="font-medium text-prestij-purple hover:text-prestij-purple-light hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  );
}