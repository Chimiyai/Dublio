// src/components/profile/VerifyEmailClientContent.tsx
'use client'; // Bu client component olacak

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailClientContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [message, setMessage] = useState<string>('E-posta adresiniz doğrulanıyor, lütfen bekleyin...');
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setMessage('Doğrulama linki geçersiz veya eksik.');
        setIsError(true);
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/profile/email/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!response.ok) {
          setMessage(data.message || 'E-posta doğrulaması başarısız oldu.');
          setIsError(true);
        } else {
          setMessage(data.message || 'E-posta adresiniz başarıyla doğrulandı!');
          setIsError(false);
          setTimeout(() => { router.push('/profil'); }, 3000); 
        }
      } catch (error) {
        console.error("Doğrulama API isteği hatası:", error);
        setMessage('Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    verifyToken();
  }, [token, router]);

  return (
    <div className="max-w-md w-full text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        E-posta Doğrulama
      </h1>
      {isLoading ? (
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      ) : (
        <div>
          <p className={`text-lg mb-6 ${isError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {message}
          </p>
          {!isError ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Profil sayfanıza yönlendiriliyorsunuz...</p>
          ) : (
            <Link href="/profil" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Profil Sayfasına Dön
            </Link>
          )}
        </div>
      )}
    </div>
  );
}