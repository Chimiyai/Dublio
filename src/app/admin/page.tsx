// src/app/admin/page.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Library, Mic2, LayoutGrid, ShieldAlert } from 'lucide-react'; // ShieldAlert ikonunu ekledik
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getAdminDashboardStats() {
  try {
    const [userCount, projectCount, artistCount, categoryCount, pendingReportCount] = await prisma.$transaction([
      prisma.user.count(),
      prisma.project.count(),
      prisma.dubbingArtist.count(),
      prisma.category.count(),
      prisma.userReport.count({ where: { status: 'pending' } }) // <<< YENİ: Bekleyen rapor sayısını say
    ]);

    return { userCount, projectCount, artistCount, categoryCount, pendingReportCount };

  } catch (error) {
    console.error("Admin dashboard istatistikleri çekilirken hata:", error);
    return { userCount: 0, projectCount: 0, artistCount: 0, categoryCount: 0, pendingReportCount: 0 };
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10"> {/* Grid 5 sütunlu oldu */}
        {/* Toplam Kullanıcı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
          </CardContent>
        </Card>
        
        {/* Toplam Proje */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Proje</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectCount}</div>
          </CardContent>
        </Card>

        {/* Toplam Sanatçı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sanatçı</CardTitle>
            <Mic2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.artistCount}</div>
          </CardContent>
        </Card>

        {/* Toplam Kategori */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categoryCount}</div>
          </CardContent>
        </Card>
        
        {/* YENİ: Bekleyen Raporlar Kartı */}
        <Card className={stats.pendingReportCount > 0 ? "bg-red-900/20 border-red-500/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Raporlar</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReportCount}</div>
            {stats.pendingReportCount > 0 && <p className="text-xs text-red-400">Yeni raporlar mevcut</p>}
          </CardContent>
        </Card>
        {/* ============================== */}
      </div>

      {/* Yönetim Linkleri */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Yönetim Bölümleri
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <Link href="/admin/kategoriler" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Kategori Yönetimi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Proje kategorilerini yönetin ve yenilerini oluşturun.</p>
          </Link>
          
          {/* YENİ: Rapor Yönetimi Linki */}
          <Link href="/admin/raporlar" className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow relative">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Rapor Yönetimi</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kullanıcılar tarafından gönderilen raporları inceleyin.</p>
            {stats.pendingReportCount > 0 && (
              <span className="absolute top-3 right-3 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Link>
          {/* ============================== */}
        </div>
      </div>
    </div>
  );
}