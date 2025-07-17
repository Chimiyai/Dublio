// src/app/admin/projeler/duzenle/[projectId]/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Prisma } from '@prisma/client'; // Prisma'yı ve tiplerini import edelim
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import EditProjectForm from '@/components/admin/EditProjectForm';
import ManageAssets from '@/components/admin/ManageAssets';

// === DÜZELTME: Sorguyu son ve en basit şemaya göre güncelliyoruz ===
const projectForAdminQuery = {
  include: {
    content: true,
    team: true,
    // Artık 'projectAssetSettings' yerine doğrudan 'assets' çekiyoruz.
    assets: {
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { username: true } }
      }
    }
  }
} as const;

// Tip tanımını yeni sorguya göre yapalım.
export type ProjectForAdmin = Prisma.ProjectGetPayload<typeof projectForAdminQuery>;

// Veri çeken fonksiyonu güncelliyoruz.
async function getProjectForAdmin(projectId: number): Promise<ProjectForAdmin | null> {
  return prisma.project.findUnique({
    where: { id: projectId },
    ...projectForAdminQuery,
  });
}

// Formun seçenekleri için ek verileri de çekelim.
async function getFormData() {
    const allContents = await prisma.content.findMany();
    const allTeams = await prisma.team.findMany();
    return { allContents, allTeams };
}

// === SAYFA BİLEŞENİ ===
export default async function EditProjectPage({ params }: { params: { projectId: string } }) {
  const projectId = parseInt(params.projectId, 10);
  if (isNaN(projectId)) return notFound();

  const [project, formData] = await Promise.all([
      getProjectForAdmin(projectId),
      getFormData()
  ]);
  
  if (!project) return notFound();

  return (
    <AdminPageLayout pageTitle={`Projeyi Düzenle: ${project.name}`}>
        <div style={{ marginBottom: '40px' }}>
            <h2>Proje Detayları</h2>
            <EditProjectForm
                isEditing={true}
                project={project}
                allContents={formData.allContents}
                allTeams={formData.allTeams}
            />
        </div>
        <hr style={{ margin: '40px 0' }}/>
        <div>
            <h2>Proje Assetleri</h2>
            <ManageAssets initialProject={project} />
        </div>
    </AdminPageLayout>
  );
}