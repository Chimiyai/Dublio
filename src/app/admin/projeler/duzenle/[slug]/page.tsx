// src/app/admin/projeler/duzenle/[slug]/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';
import { DubbingArtist, RoleInProject } from '@prisma/client'; // Project'i buradan kaldırdık, ProjectFormData kullanacağız
import EditProjectForm, { ProjectFormData, ProjectTypeEnum } from '@/components/admin/EditProjectForm'; // ProjectFormData ve ProjectTypeEnum'u import et
import { Metadata, ResolvingMetadata } from 'next';

interface EditProjectPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  { params: { slug } }: EditProjectPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const project = await prisma.project.findUnique({
    where: { slug: slug },
    select: { title: true },
  });

  if (!project) {
    return { title: 'Proje Bulunamadı | Admin Paneli' };
  }
  return {
    title: `Düzenle: ${project.title} | Admin Paneli`,
  };
}

export default async function EditProjectPage({ params: { slug } }: EditProjectPageProps) {
  const [projectFromDb, allArtistsFromDb] = await Promise.all([
    prisma.project.findUnique({
      where: { slug: slug },
      include: {
         assignments: { // Bu kısım zaten doğru görünüyor, artistName EditProjectForm içinde eklenecek
           select: {
              artistId: true,
              role: true
           }
         }
      }
    }),
    prisma.dubbingArtist.findMany({
      orderBy: { firstName: 'asc' },
      select: { id: true, firstName: true, lastName: true } // Sadece gerekli alanları seç
    })
  ]);

  if (!projectFromDb) {
    notFound();
  }

  const availableRoles = Object.values(RoleInProject);

  // Veritabanından gelen projectFromDb'yi ProjectFormData tipine dönüştür
  const projectForForm: ProjectFormData = {
    id: projectFromDb.id,
    title: projectFromDb.title,
    slug: projectFromDb.slug,
    type: projectFromDb.type as ProjectTypeEnum, // <<=== ÖNEMLİ DEĞİŞİKLİK BURADA
    description: projectFromDb.description, // null olabilir, ProjectFormData'da öyle tanımlı
    coverImagePublicId: projectFromDb.coverImagePublicId, // null olabilir
    bannerImagePublicId: projectFromDb.bannerImagePublicId, // null olabilir, ProjectFormData'da opsiyonel olmalı
    releaseDate: projectFromDb.releaseDate, // Date | null, ProjectFormData'da Date | string | null demiştik, bu uyumlu
    isPublished: projectFromDb.isPublished,
    // assignments objeleri { artistId: number, role: RoleInProject, artistName?: string } bekliyor
    // artistName'i EditProjectForm kendi içinde allArtists listesinden ekleyecek
    assignments: projectFromDb.assignments.map(a => ({
      artistId: a.artistId,
      role: a.role,
      // artistName burada eklenmeyecek, EditProjectForm içinde allArtists kullanılarak eklenecek
    })),
    createdAt: projectFromDb.createdAt, // ProjectFormData'da opsiyonel
    updatedAt: projectFromDb.updatedAt, // ProjectFormData'da opsiyonel
  };

  // allArtists'ı da EditProjectForm'un beklediği tipe map'leyelim (eğer farklıysa)
  // Şu anki allArtistsFromDb zaten { id, firstName, lastName }[] formatında, bu EditProjectForm'un beklediğiyle aynı.

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/projeler" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Geri Dön (Proje Listesi)
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
        Proje Düzenle: <span className="text-indigo-600">{projectFromDb.title}</span>
      </h1>
      <div className="max-w-4xl mx-auto">
        <EditProjectForm
          project={projectForForm} // <<=== DÖNÜŞTÜRÜLMÜŞ VERİYİ KULLAN
          allArtists={allArtistsFromDb}
          availableRoles={availableRoles}
          isEditing={true} // isEditing prop'unu ekledik EditProjectForm'a
        />
      </div>
    </div>
  );
}