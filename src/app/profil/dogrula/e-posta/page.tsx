// src/app/profil/dogrula/e-posta/page.tsx
import { Suspense } from 'react';
import VerifyEmailClientContent from '@/components/profile/VerifyEmailClientContent'; // Yeni client component

// Yükleniyor göstergesi için basit bir component
function VerifyEmailLoading() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
      <div className="max-w-md w-full text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          E-posta Doğrulama
        </h1>
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPageWrapper() { // Wrapper component
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
      <Suspense fallback={<VerifyEmailLoading />}>
        <VerifyEmailClientContent />
      </Suspense>
    </div>
  );
}