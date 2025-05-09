// src/app/admin/projeler/duzenle/[slug]/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';
import { Project, DubbingArtist, RoleInProject } from '@prisma/client';
import EditProjectForm from '@/components/admin/EditProjectForm';
import { Metadata, ResolvingMetadata } from 'next';

interface EditProjectPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  { params: { slug } }: EditProjectPageProps, // DOĞRUDAN DESTRUCTURING
  parent: ResolvingMetadata
): Promise<Metadata> {
  const project = await prisma.project.findUnique({
    where: { slug: slug }, // slug'ı direkt kullan
    select: { title: true },
  });

  if (!project) {
    return { title: 'Proje Bulunamadı | Admin Paneli' };
  }
  return {
    title: `Düzenle: ${project.title} | Admin Paneli`,
  };
}

export default async function EditProjectPage({ params: { slug } }: EditProjectPageProps) { // DOĞRUDAN DESTRUCTURING
  const [projectData, allArtists] = await Promise.all([
    prisma.project.findUnique({
      where: { slug: slug }, // slug'ı direkt kullan
      include: {
         assignments: {
           select: {
              artistId: true,
              role: true
           }
         }
      }
    }),
    prisma.dubbingArtist.findMany({
      orderBy: { firstName: 'asc' }
    })
  ]);

  if (!projectData) {
    notFound();
  }

  const availableRoles = Object.values(RoleInProject);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/projeler" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Geri Dön (Proje Listesi)
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
        Proje Düzenle: <span className="text-indigo-600">{projectData.title}</span>
      </h1>
      <div className="max-w-4xl mx-auto">
        <EditProjectForm
          project={projectData}
          allArtists={allArtists}
          availableRoles={availableRoles}
        />
      </div>
    </div>
  );
}