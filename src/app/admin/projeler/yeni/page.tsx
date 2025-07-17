// src/app/admin/projeler/yeni/page.tsx

import prisma from '@/lib/prisma';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import NewProjectForm from '@/components/projects/NewProjectForm';
import { ContentType } from '@prisma/client'; // ContentType'ı import etmeyi unutma

async function getNewProjectData() {
  // DÜZELTME: `select` bloğunu kaldırıyoruz.
  // Bu, Prisma'nın `Content` modelinin tüm skalar (temel) alanlarını getirmesini sağlar.
  const contents = await prisma.content.findMany();

  // DÜZELTME: `select` bloğunu kaldırıyoruz.
  // Bu, Prisma'nın `Team` modelinin tüm skalar (temel) alanlarını getirmesini sağlar.
  const teams = await prisma.team.findMany();

  return {
    allContents: contents,
    allTeams: teams,
  };
}

export default async function AddNewProjectPage() {
  const formData = await getNewProjectData();

  return (
    <AdminPageLayout pageTitle="Yeni Proje Başlat">
      <NewProjectForm
        contents={formData.allContents}
        teams={formData.allTeams}
      />
    </AdminPageLayout>
  );
}