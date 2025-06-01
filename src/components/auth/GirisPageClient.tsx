// src/app/(auth)/giris/page.tsx
"use client";

import { Suspense } from 'react';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react'; // signIn ve useSession
import { useRouter, useSearchParams } from 'next/navigation'; // Yönlendirme ve query params için
// import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function GirisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (status === "authenticated") {
      router.replace('/'); // Veya "/profil" veya istenen başka bir sayfa
    }
  }, [status, router]);

  // Kayıt sonrası başarı mesajını göster
  useEffect(() => {
    const kayitDurumu = searchParams.get('kayit');
    if (kayitDurumu === 'basarili') {
      setSuccessMessage('Kaydınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
      // İsteğe bağlı: URL'den query param'ı temizle
      // router.replace('/giris', { scroll: false });
    }
    const nextAuthError = searchParams.get('error');
    if (nextAuthError) {
        // NextAuth'un redirect ile gönderdiği hataları yakala
        // Örnek: CredentialsSignin, EmailSignin, vb.
        // Bu hataları daha kullanıcı dostu mesajlara çevirebilirsiniz.
        if (nextAuthError === "CredentialsSignin") {
            setError("E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.");
        } else {
            setError("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }
    }

  }, [searchParams, router]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Hata durumunda sayfada kalmak için false
        email: email,
        password: password,
      });

      if (result?.error) {
        // Hata mesajını NextAuth'tan gelen `error` parametresine göre ayarla
        if (result.error === "CredentialsSignin") {
            setError("E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.");
        } else {
            setError(result.error || 'Giriş sırasında bir hata oluştu.');
        }
        setIsLoading(false);
      } else if (result?.ok) {
        // Başarılı giriş, NextAuth zaten yönlendirme yapabilir (eğer callbackUrl varsa)
        // Veya burada manuel yönlendirme yapabilirsiniz.
        // `useEffect` içindeki status kontrolü de yönlendirmeyi yapacaktır.
        router.push('/'); // Veya istediğiniz bir sayfa, örn: /profil
      } else {
        setError('Beklenmedik bir durum oluştu. Lütfen tekrar deneyin.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Giriş hatası yakalandı:", err);
      setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Yükleniyor...</div>;
  }
  // Eğer zaten giriş yapılmışsa (useEffect yönlendirene kadar) bir şey gösterme veya null döndür
  if (session) return null;


  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-prestij-bg-dark-1 shadow-xl rounded-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-prestij-text-primary">
          Giriş Yap
        </h1>
        <p className="mt-2 text-prestij-text-muted">
          Hesabınıza erişin.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-md mb-4">
            <p className="text-sm text-green-400">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-prestij-text-secondary mb-1">
            E-posta Adresi
          </label>
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-prestij-text-secondary mb-1">
            Şifre
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-prestij-purple hover:bg-prestij-purple-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-prestij-purple disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /* ... */ ></svg>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-prestij-text-muted">
        Hesabın yok mu?{' '}
        <Link href="/kayit" className="font-medium text-prestij-purple hover:text-prestij-purple-light hover:underline">
          Kayıt Ol
        </Link>
      </p>
    </div>
  );
}