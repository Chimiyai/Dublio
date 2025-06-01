// src/app/admin/projeler/duzenle/[slug]/page.tsx
import prisma from '@/lib/prisma';
import EditProjectForm, { InitialProjectData, ProjectTypeEnum } from '@/components/admin/EditProjectForm'; // ProjectTypeEnum import edildi
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import { RoleInProject } from '@prisma/client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

async function getProjectDataForEdit(slug: string) {
  const projectFromDb = await prisma.project.findUnique({
    where: { slug },
    include: {
      assignments: {
        include: {
          artist: { select: { id: true, firstName: true, lastName: true } },
          voiceRoles: {
            select: {
              character: { select: { id: true, name: true } }
            }
          }
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

  // ProjectFormData'ya uygun hale getir
  const formattedProject: InitialProjectData = { // Bu tip InitialProjectData olmalı
    id: projectFromDb.id,
    title: projectFromDb.title,
    slug: projectFromDb.slug,
    type: projectFromDb.type as ProjectTypeEnum,
    description: projectFromDb.description || null,
    coverImagePublicId: projectFromDb.coverImagePublicId || null,
    bannerImagePublicId: projectFromDb.bannerImagePublicId || null,
    releaseDate: projectFromDb.releaseDate ? new Date(projectFromDb.releaseDate).toISOString().split('T')[0] : '',
    isPublished: projectFromDb.isPublished,
    price: projectFromDb.price === null ? null : Number(projectFromDb.price),
    currency: projectFromDb.currency || null,
    assignments: projectFromDb.assignments.map((a, index) => ({ // index eklendi
      tempId: `${Date.now()}-server-${a.artistId}-${index}`, // YENİ: Sunucu tarafında geçici ID ata
      artistId: a.artistId,
      role: a.role,
      artistName: `${a.artist.firstName} ${a.artist.lastName}`,
      characterIds: a.role === RoleInProject.VOICE_ACTOR && a.voiceRoles
        ? a.voiceRoles.map(vr => vr.character.id)
        : undefined,
    })),
    categoryIds: projectFromDb.categories.map(pc => pc.category.id),
  };
  return {
    project: formattedProject,
    allArtists: allArtists.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` })),
    allCategories: allCategories.map(c => ({ value: c.id, label: c.name })),
    availableRoles: Object.values(RoleInProject),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: pageSlug } = await params;
  const projectData = await getProjectDataForEdit(pageSlug);
  if (!projectData?.project) {
    return { title: 'Proje Bulunamadı | Admin' };
  }
  return {
    title: `Düzenle: ${projectData.project.title} | Proje Yönetimi`,
  };
}

export default async function EditExistingProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: pageSlug } = await params;
  const data = await getProjectDataForEdit(pageSlug);

  if (!data || !data.project) {
    notFound();
  }

  return (
    <AdminPageLayout 
      pageTitle={`Projeyi Düzenle`}
      backLink={{ href: '/admin/projeler', label: 'Proje Listesine Dön' }}
      breadcrumbs={[
        { label: "Proje Yönetimi", href: "/admin/projeler" },
        { label: data.project.title, href: `/admin/projeler/duzenle/${data.project.slug}` } 
      ]}
    >
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