// src/app/admin/projeler/yeni/page.tsx
import prisma from '@/lib/prisma'; // Prisma importu eklendi
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { RoleInProject } from '@prisma/client';
// EditProjectForm'u ve ProjectFormData tipini import et
import EditProjectForm, { ProjectFormData, ProjectTypeEnum } from '@/components/admin/EditProjectForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yeni Proje Ekle | Admin Paneli',
};

async function getRequiredData() {
  const allArtists = await prisma.dubbingArtist.findMany({
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    select: { id: true, firstName: true, lastName: true }
  });
  const availableRoles = Object.values(RoleInProject);
  return { allArtists, availableRoles };
}

export default async function YeniProjePageServer() {
  const { allArtists, availableRoles } = await getRequiredData();

  // EditProjectForm'un beklediği ProjectFormData tipinde varsayılan obje
  const defaultProjectDataForNew: ProjectFormData = {
    // id: undefined, // id opsiyonel olduğu için belirtmeye gerek yok
    title: '',
    slug: '',
    type: 'game' as ProjectTypeEnum, // Varsayılan tür, ProjectTypeEnum'a cast et
    description: '', // Veya null
    coverImagePublicId: null,
    releaseDate: '', // Formda boş string, API'de null/date
    isPublished: true,
    assignments: [],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Yeni Proje Ekle</h1>
        <Link href="/admin/projeler" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Geri Dön (Proje Listesi)
        </Link>
      </div>
      {/* <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
        Yeni Proje Ekle // Bu başlığı yukarı taşıdık veya kaldırabilirsin, form içinde zaten var
      </h1> */}
      <div className="max-w-4xl mx-auto">
        <EditProjectForm
          project={defaultProjectDataForNew}
          allArtists={allArtists}
          availableRoles={availableRoles}
          isEditing={false} // Yeni proje modu
        />
      </div>
    </div>
  );
}