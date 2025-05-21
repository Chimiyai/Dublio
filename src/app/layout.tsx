// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/layout/Footer"; // Footer'ı import et
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prestij Dublaj",
  description: "Oyun ve anime dublajları - Prestij Ekibi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </Head>
      <body className={`${inter.className} bg-bg-primary-dark text-gray-300`}> {/* Temel renkler */}
        <Providers>
          <Toaster position="top-center" reverseOrder={false} />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16 sm:pt-20">{children}</main> {/* Navbar yüksekliği kadar padding */}
            <Footer /> {/* Footer burada */}
          </div>
        </Providers>
      </body>
    </html>
  );
}