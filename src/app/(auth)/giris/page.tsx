// src/app/(auth)/giris/page.tsx (Eğer bu bir Server Component ise)
import { Suspense } from 'react';
import GirisPageClient from '@/components/auth/GirisPageClient'; // GirisPage mantığını buraya taşı

// Yükleniyor göstergesi için basit bir component
function LoginPageLoading() {
  return <div className="flex justify-center items-center min-h-screen">Giriş Sayfası Yükleniyor...</div>;
}

export default function GirisPageWrapper() { // Wrapper Server Component
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <GirisPageClient /> {/* Asıl client component'in */}
    </Suspense>
  );
}