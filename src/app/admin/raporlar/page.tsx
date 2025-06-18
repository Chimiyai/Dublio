// src/app/admin/raporlar/page.tsx

import { Metadata } from 'next';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import ReportManager from '@/components/admin/ReportManager'; // Oluşturacağımız Client Component

export const metadata: Metadata = {
  title: 'Kullanıcı Raporları | Admin Paneli',
};

export const revalidate = 0; // Her zaman en güncel veriyi göster

export default function AdminReportsPage() {
  return (
    <AdminPageLayout pageTitle="Kullanıcı Raporları">
      <p className="text-gray-400 mb-6">
        Kullanıcılar tarafından gönderilen raporları buradan inceleyebilir ve yönetebilirsiniz.
      </p>
      <ReportManager />
    </AdminPageLayout>
  );
}