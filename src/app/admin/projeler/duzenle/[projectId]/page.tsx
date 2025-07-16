///admin/projeler/duzenle/[projectId]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Prisma } from '@prisma/client';
import ManageAssets from '@/components/admin/ManageAssets'; // Yeni istemci bileşenimiz

const projectWithAssetsQuery = {
  include: {
    assets: {
      orderBy: { createdAt: 'desc' } as const,
      include: {
        uploader: { select: { username: true } }
      }
    }
  }
};

type ProjectWithAssets = Prisma.ProjectGetPayload<typeof projectWithAssetsQuery>;

async function getProjectForAdmin(projectId: number): Promise<ProjectWithAssets | null> {
  return prisma.project.findUnique({
    where: { id: projectId },
    ...projectWithAssetsQuery,
  });
}

export default async function EditProjectPage({ params }: { params: { projectId: string } }) {
  const projectId = parseInt(params.projectId, 10);
  if (isNaN(projectId)) return notFound();

  const project = await getProjectForAdmin(projectId);
  if (!project) return notFound();

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Proje: {project.name}</h1>
      <p>Bu projeye ait ham dosyaları (asset) buradan yönetebilirsiniz.</p>
      
      <hr style={{ margin: '20px 0' }} />
      
      <ManageAssets initialProject={project} />
    </div>
  );
}