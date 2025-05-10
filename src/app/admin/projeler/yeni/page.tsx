// src/app/admin/projeler/yeni/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DubbingArtist, RoleInProject } from '@prisma/client';
import AddProjectForm from '@/components/admin/AddProjectForm'; // Yeni Client Component'i import et
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yeni Proje Ekle | Admin Paneli',
};

async function getFormData() {
  const allArtists = await prisma.dubbingArtist.findMany({
    orderBy: { firstName: 'asc' },
    // select: { id: true, firstName: true, lastName: true } // <-- BU SATIRI SİL VEYA YORUM SATIRI YAP
  });
  const availableRoles = Object.values(RoleInProject); 
  return { allArtists, availableRoles };
}

export default async function YeniProjePage() { // BU BİR SERVER COMPONENT
  const { allArtists, availableRoles } = await getFormData();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... (başlık ve geri dön linki) ... */}
      <div className="max-w-4xl mx-auto">
        <AddProjectForm // BU BİR CLIENT COMPONENT OLMALI
          allArtists={allArtists}
          availableRoles={availableRoles}
        />
      </div>
    </div>
  );
}