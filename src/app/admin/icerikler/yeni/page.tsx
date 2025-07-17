// src/app/admin/icerikler/yeni/page.tsx

import AdminPageLayout from "@/components/admin/AdminPageLayout";
import ContentForm from "@/components/admin/ContentForm";

export default function NewContentPage() {
  return (
    <AdminPageLayout pageTitle="Yeni İçerik Ekle">
      <p style={{ color: '#aaa', marginTop: '-10px', marginBottom: '20px' }}>
        Ekiplerin projelendirmesi için platforma yeni bir oyun, anime veya manga ekleyin.
      </p>
      <ContentForm />
    </AdminPageLayout>
  );
}