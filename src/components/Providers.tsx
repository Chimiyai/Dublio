// src/components/Providers.tsx
'use client'; // Bu bileşenin bir Client Component olduğunu belirtiyoruz

import { SessionProvider } from 'next-auth/react';
import React from 'react'; // React'ı ve children tipini import ediyoruz

// Bileşenin alacağı prop'ları tanımlıyoruz (React.ReactNode tipinde children)
interface Props {
  children: React.ReactNode;
}

// Providers bileşenimiz
export default function Providers({ children }: Props) {
  // NextAuth'un SessionProvider'ını kullanarak children'ı (yani uygulamamızın geri kalanını) sarmalıyoruz.
  // Bu sayede alt bileşenler useSession hook'unu kullanarak oturum bilgisine erişebilir.
  return <SessionProvider>{children}</SessionProvider>;
}