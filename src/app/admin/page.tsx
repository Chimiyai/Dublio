// src/app/admin/page.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Bu component'in yolunun doğru olduğundan emin ol
import { Users, Library, Mic2, LayoutGrid } from 'lucide-react'; // LayoutGrid ikonunu ekledik
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getAdminDashboardStats() {
  try {
    // Tüm sayımları tek bir transaction içinde yapmak daha performanslıdır
    const [userCount, projectCount, artistCount, categoryCount] = await prisma.$transaction([
      prisma.user.count(),
      prisma.project.count(),
      prisma.dubbingArtist.count(),
      prisma.category.count() // <<< YENİ: Toplam kategori sayısını da say
    ]);

    return { userCount, projectCount, artistCount, categoryCount };

  } catch (error) {
    console.error("Admin dashboard istatistikleri çekilirken hata:", error);
    return { userCount: 0, projectCount: 0, artistCount: 0, categoryCount: 0 };
  }
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Admin Paneline Hoş Geldiniz
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Siteyi buradan yönetebilir ve genel istatistikleri görüntüleyebilirsiniz.
        </p>
      </div>

      {/* İstatistik Kartları */}
      {/* Grid'i 4 sütunlu olacak şekilde güncelledik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Proje</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sanatçı</CardTitle>
            <Mic2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.artistCount}</div>
          </CardContent>
        </Card>
        
        {/* YENİ KATEGORİ İSTATİSTİK KARTI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categoryCount}</div>
          </CardContent>
        </Card>
        {/* ============================== */}

      </div>

      {/* Yönetim Linkleri */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Yönetim Bölümleri
        </h2>
        {/* Grid'i 4 sütunlu olacak şekilde güncelledik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/projeler" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Proje Yönetimi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Yeni projeler ekleyin, mevcutları düzenleyin veya silin.</p>
          </Link>
          <Link href="/admin/kullanicilar" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Kullanıcı Yönetimi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kullanıcıları listeleyin, rollerini değiştirin veya silin.</p>
          </Link>
          <Link href="/admin/sanatcilar" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Sanatçı Yönetimi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sanatçıları yönetin, yeni sanatçı ekleyin veya mevcutları düzenleyin.</p>
          </Link>
          
          {/* YENİ KATEGORİ YÖNETİM LİNKİ */}
          <Link href="/admin/kategoriler" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Kategori Yönetimi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Proje kategorilerini yönetin ve yenilerini oluşturun.</p>
          </Link>
          {/* ============================== */}

        </div>
      </div>
    </div>
  );
}