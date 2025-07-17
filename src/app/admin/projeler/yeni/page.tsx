// src/app/admin/projeler/yeni/page.tsx

import prisma from '@/lib/prisma';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import EditProjectForm from '@/components/admin/EditProjectForm'; // Bu component artık hem yeni hem düzenleme için kullanılıyor

async function getFormData() {
  const allContents = await prisma.content.findMany();
  const allTeams = await prisma.team.findMany();
  return { allContents, allTeams };
}

export default async function AddNewProjectPage() {
  const formData = await getFormData();

  return (
    <AdminPageLayout pageTitle="Yeni Proje Oluştur">
      <EditProjectForm
        isEditing={false} // Yeni proje modunda
        allContents={formData.allContents}
        allTeams={formData.allTeams}
      />
    </AdminPageLayout>
  );
}