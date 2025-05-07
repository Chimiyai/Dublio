// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar"; // Navbar'ı import et

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prestij Dublaj",
  description: "Oyun ve anime dublajları - Prestij Ekibi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <Providers>
          <Navbar /> {/* <-- Navbar'ı buraya ekledik */}
          <main className="container mx-auto px-4 py-8"> {/* Ana içeriğe biraz padding ekleyelim */}
            {children}
          </main>
          {/* Footer eklenebilir */}
        </Providers>
      </body>
    </html>
  );
}