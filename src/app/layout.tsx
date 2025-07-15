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
  title: "Dublio",
  description: "Gelişmiş Arayüz",
};

// --- YENİ FONKSİYON ---
const getSoundFilesAsBase64 = (): { name: string; data: string }[] => {
  try {
    const soundsDirectory = path.join(process.cwd(), 'public', 'sounds');
    const filenames = fs.readdirSync(soundsDirectory)
      .filter(file => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg'));
      
    return filenames.map(filename => {
      // Dosyanın tam yolunu al
      const filePath = path.join(soundsDirectory, filename);
      // Dosyayı oku ve Base64 string'ine çevir
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      // Dosyanın content-type'ını belirle
      const mimeType = filename.endsWith('.mp3') ? 'audio/mpeg' : (filename.endsWith('.wav') ? 'audio/wav' : 'audio/ogg');
      
      // Data URL formatında döndür: "data:audio/mpeg;base64,S0x..."
      return {
        name: filename,
        data: `data:${mimeType};base64,${base64Data}`
      };
    });
  } catch (error) {
    console.error("Base64 ses dosyaları okunurken hata:", error);
    return [];
  }
};
// --------------------

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const soundFilesData = getSoundFilesAsBase64();

  return (
    <html lang="tr" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className={`${inter.className} bg-site-bg-main text-dublio-text-primary min-h-screen`}>
        <Providers>
          <ClientToaster />
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
        <GlobalSoundPlayer soundFilesData={soundFilesData} />
      </body>
    </html>
  );
}