// src/app/admin/projeler/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import AdminPageLayout from '@/components/admin/AdminPageLayout'; // Layout'u import et
import ProjectsTable from '@/components/admin/ProjectsTable'; // Tabloyu ayrı bir client component'e taşıyacağız

export const dynamic = 'force-dynamic';

// Sunucu tarafında tüm projeleri çekiyoruz
async function getAllProjects() {
  return prisma.project.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    // Tablo için gerekli temel alanları seçebiliriz, detaylar düzenleme sayfasında
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      releaseDate: true,
      isPublished: true,
      createdAt: true, // Sıralama veya bilgi için
    }
  });
}

export default async function AdminProjelerPage() {
  const allProjects = await getAllProjects();

  return (
    <AdminPageLayout
      pageTitle="Proje Yönetimi"
      // Breadcrumbs opsiyonel, bu ana sayfa olduğu için gerekmeyebilir
      // breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Projeler", href: "/admin/projeler" }]}
    >
      {/* Arama ve Yeni Ekle Butonu için bir üst bölüm */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-6 sm:p-0"> 
      {/* Formlar AdminPageLayout içindeki beyaz kartta olacağı için buraya padding ekledim,
          veya bu div'i AdminPageLayout'un child'ı olan ilk div içine taşıyabiliriz.
          Şimdilik AdminPageLayout children'ına doğrudan ProjectsTable'ı vereceğiz.
          Bu üst barı ProjectsTable component'inin içine almak daha iyi olabilir.
      */}
        <div>
          {/* ARAMA INPUTU BURAYA GELECEK (ProjectsTable içinde) */}
        </div>
        <Link
          href="/admin/projeler/yeni"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center text-sm w-full sm:w-auto justify-center"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Yeni Proje Ekle
        </Link>
      </div>

      {/* Proje tablosunu ayrı bir Client Component'e taşıyoruz */}
      {/* Bu sayede arama state'i ve filtreleme client'ta yönetilebilir */}
      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-lg overflow-hidden">
        <ProjectsTable initialProjects={allProjects} />
      </div>
    </AdminPageLayout>
  );
}