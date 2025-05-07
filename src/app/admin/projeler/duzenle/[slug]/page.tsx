import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditProjectForm from '@/components/admin/EditProjectForm';
import type { Project } from '@prisma/client';

interface EditPageProps {
  params: {
    slug: string;
  };
}

export default async function AdminEditProjectPage({ params }: EditPageProps) {
  const slug = params.slug;
  const project = await prisma.project.findUnique({
    where: { slug: slug },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Proje Düzenle: <span className="text-indigo-600 dark:text-indigo-400">{project.title}</span>
        </h1>
        <Link href="/admin/projeler" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          ← Proje Listesine Geri Dön
        </Link>
      </div>
      <EditProjectForm project={project as Project} />
    </div>
  );
}

export async function generateMetadata({ params }: EditPageProps) {
    const project = await prisma.project.findUnique({
        where: { slug: params.slug },
        select: { title: true }
    });
    if (!project) {
        return { title: 'Proje Bulunamadı' }
    }
    return {
        title: `Düzenle: ${project.title} | Admin Paneli`,
    }
}