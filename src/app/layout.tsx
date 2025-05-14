// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar"; // Navbar'ı import et
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prestij Dublaj",
  description: "Oyun ve anime dublajları - Prestij Ekibi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900`}>
        <Providers>
          <Toaster position="top-center" reverseOrder={false} /> {/* Toaster'ı ekle */}
          <Navbar />
          <main className="pt-16 sm:pt-20">{children}</main>
        </Providers>
      </body>
    </html>
  );
}