// src/app/admin/kategoriler/page.tsx

import { Metadata } from 'next';
import CategoryManager from '@/components/admin/CategoryManager'; // Oluşturacağımız Client Component
import AdminPageLayout from '@/components/admin/AdminPageLayout'; // Admin panelinizin genel layout'u varsa

export const metadata: Metadata = {
  title: 'Kategori Yönetimi | Admin Paneli',
  description: 'Mevcut proje kategorilerini yönetin ve yenilerini ekleyin.',
};

// Bu sayfa dinamik olmalı, her zaman en güncel kategorileri göstermeli.
export const revalidate = 0; 

export default function AdminKategorilerPage() {
  return (
    // Eğer bir admin layout'unuz varsa onu kullanın, yoksa basit bir div olabilir.
    <AdminPageLayout pageTitle="Kategori Yönetimi">
      <p className="text-gray-400 mb-6">
        Sitedeki projeleri gruplamak için kullanılan kategorileri buradan ekleyebilir, düzenleyebilir ve silebilirsiniz.
      </p>
      <CategoryManager />
    </AdminPageLayout>
  );
}