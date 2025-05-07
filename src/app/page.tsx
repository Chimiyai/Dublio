import Link from 'next/link';

console.log("!!!!!!!! ANA SAYFA (page.tsx) SUNUCUDA ÇALIŞTI !!!!!!!!"); // <-- YENİ LOG

export default function HomePage() {
  console.log("!!!!!!!! HomePage Komponenti SUNUCUDA Render Ediliyor !!!!!!!!"); // <-- YENİ LOG

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Prestij Dublaj Projesi</h1>
      <div className="flex space-x-4">
        <Link href="/kayit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
          Kayıt Ol
        </Link>
        <Link href="/giris" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700">
          Giriş Yap
        </Link>
      </div>
    </main>
  );
}