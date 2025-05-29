// src/app/admin/projeler/duzenle/[slug]/page.tsx
import prisma from '@/lib/prisma';
import EditProjectForm, { ProjectFormData, ProjectTypeEnum } from '@/components/admin/EditProjectForm'; // ProjectTypeEnum import edildi
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { RoleInProject } from '@prisma/client';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';

interface EditPageProps { params: { slug: string }; }

interface EditPageProps {
  params: { slug: string };
}

async function getProjectDataForEdit(slug: string) {
  const projectFromDb = await prisma.project.findUnique({ // Değişken adını değiştirdim karışmaması için
    where: { slug },
    include: {
      assignments: {
        include: {
          artist: { select: { id: true, firstName: true, lastName: true } }
        }
      },
      categories: {
        select: {
          category: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!projectFromDb) return null;

  const allArtists = await prisma.dubbingArtist.findMany({
    select: { id: true, firstName: true, lastName: true }
  });
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true }
  });

  const projectCategoryIds = projectFromDb.categories.map(pc => pc.category.id);

  // ProjectFormData'ya uygun hale getir
  const formattedProject: ProjectFormData = {
    id: projectFromDb.id,
    title: projectFromDb.title,
    slug: projectFromDb.slug,
    // DÜZELTME: type alanını ProjectTypeEnum'a cast et veya kontrol et
    type: projectFromDb.type as ProjectTypeEnum, // En basit çözüm, verinin doğru olduğunu varsayar
    // Daha güvenli bir yöntem:
    // type: (projectFromDb.type === 'oyun' || projectFromDb.type === 'anime') 
    //         ? projectFromDb.type as ProjectTypeEnum 
    //         : 'oyun', // Veya bir hata fırlat / varsayılan ata
    description: projectFromDb.description || null,
    coverImagePublicId: projectFromDb.coverImagePublicId || null,
    bannerImagePublicId: projectFromDb.bannerImagePublicId || null,
    releaseDate: projectFromDb.releaseDate ? new Date(projectFromDb.releaseDate).toISOString().split('T')[0] : '',
    isPublished: projectFromDb.isPublished,
    price: projectFromDb.price === null ? null : Number(projectFromDb.price),
    currency: projectFromDb.currency || null,
    assignments: projectFromDb.assignments.map(a => ({
      artistId: a.artistId,
      role: a.role,
      artistName: `${a.artist.firstName} ${a.artist.lastName}`
    })),
    categoryIds: projectCategoryIds,
    // API'den gelen ve ProjectFormData'da olmayan ekstra alanları buraya eklemeyin
    // veya ProjectFormData'yı buna göre güncelleyin.
    // Örneğin, Prisma'dan gelen 'createdAt', 'updatedAt' gibi alanlar ProjectFormData'da yoksa,
    // bunları ...projectFromDb ile yayarken dikkatli olun.
    // Şimdilik manuel olarak atama yapıyoruz, bu yüzden sorun olmamalı.
  };

  return {
    project: formattedProject,
    allArtists: allArtists.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` })),
    allCategories: allCategories.map(c => ({ value: c.id, label: c.name })),
    availableRoles: Object.values(RoleInProject),
  };
}

export async function generateMetadata({ params }: EditPageProps): Promise<Metadata> {
  const projectData = await getProjectDataForEdit(params.slug);
  if (!projectData?.project) {
    return { title: 'Proje Bulunamadı | Admin' };
  }
  return {
    title: `Düzenle: ${projectData.project.title} | Proje Yönetimi`,
  };
}

export default async function EditExistingProjectPage({ params }: EditPageProps) {
  const data = await getProjectDataForEdit(params.slug);

  if (!data || !data.project) {
    notFound();
  }

  return (
    <AdminPageLayout 
      pageTitle={`Projeyi Düzenle`}
      backLink={{ href: '/admin/projeler', label: 'Proje Listesine Dön' }}
      breadcrumbs={[
        { label: "Proje Yönetimi", href: "/admin/projeler" },
        { label: data.project.title, href: `/admin/projeler/duzenle/${data.project.slug}` } // Mevcut sayfa
      ]}
    >
      {/* Form için ek bir padding ve max-width */}
      <div className="p-6 sm:p-8 max-w-3xl mx-auto"> 
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">
          Proje: <span className='font-semibold text-indigo-600 dark:text-indigo-400'>{data.project.title}</span>
        </p>
        <EditProjectForm
          project={data.project}
          allArtists={data.allArtists}
          allCategories={data.allCategories}
          availableRoles={data.availableRoles}
          isEditing={true}
        />
      </div>
    </AdminPageLayout>
  );
}
