// src/app/admin/projeler/yeni/page.tsx
import prisma from '@/lib/prisma';
import EditProjectForm from '@/components/admin/EditProjectForm';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { RoleInProject } from '@prisma/client';

async function getFormData() {
  const artists = await prisma.dubbingArtist.findMany({
    select: { id: true, firstName: true, lastName: true }
  });
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });
  return {
    allArtists: artists.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` })),
    allCategories: categories.map(c => ({ value: c.id, label: c.name })),
    availableRoles: Object.values(RoleInProject),
  };
}

export default async function AddNewProjectPage() {
  const formData = await getFormData();

  return (
    <AdminPageLayout pageTitle="Yeni Proje Ekle"> {/* Layout'u kullan */}
      <EditProjectForm
        allArtists={formData.allArtists}
        allCategories={formData.allCategories}
        availableRoles={formData.availableRoles}
        isEditing={false}
      />
    </AdminPageLayout>
  );
}
