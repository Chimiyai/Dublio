// src/app/layout.tsx
import { Toaster } from "react-hot-toast";
import fs from 'fs';
import path from 'path';
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer"; // Footer'ı import et
import Providers from "@/components/Providers";
import ClientToaster from '@/components/ui/ClientToaster';
import GlobalSoundPlayer from '@/components/layout/GlobalSoundPlayer';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PrestiJ Studio",
  description: "Gelişmiş Arayüz",
};

// --- YENİ FONKSİYON ---
// Bu fonksiyon sunucuda çalışarak /public/sounds klasöründeki dosyaları listeler.
const getSoundFiles = (): string[] => {
  try {
    // process.cwd() projenin kök dizinini verir.
    const soundsDirectory = path.join(process.cwd(), 'public/sounds');
    // Dizini oku ve dosya adlarını al
    const filenames = fs.readdirSync(soundsDirectory);
    
    // Her dosya adını, tarayıcının anlayacağı bir URL yoluna çevir.
    // Örn: "ses1.mp3" -> "/sounds/ses1.mp3"
    return filenames.map(filename => `/sounds/${filename}`);
  } catch (error) {
    console.error("Ses dosyaları okunurken hata oluştu:", error);
    // Hata durumunda boş bir dizi döndür, böylece site çökmez.
    return [];
  }
};
// --------------------

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // --- YENİ: Ses dosyası listesini burada çağır ---
  const soundFiles = getSoundFiles();
  // ---------------------------------------------

  return (
    <html lang="tr" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className={`${inter.className} bg-site-bg-main text-prestij-text-primary min-h-screen`}>
        <Providers>
          <ClientToaster />
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
        <GlobalSoundPlayer soundFiles={soundFiles} />
      </body>
    </html>
  );
}