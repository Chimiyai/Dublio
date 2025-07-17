// src/app/admin/projeler/duzenle/[projectId]/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Prisma, Content, Team } from '@prisma/client';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import EditProjectForm from '@/components/admin/EditProjectForm'; // Proje düzenleme formunu import ediyoruz
import ManageAssets from '@/components/admin/ManageAssets';     // Asset yönetim bileşenini import ediyoruz

// --- 1. KAPSAMLI VERİ ÇEKME SORGUSU ---
// Hem proje detayları (form için), hem de asset ayarları (asset listesi için)
const projectForAdminQuery = {
  include: {
    content: true, // Formda seçili değeri göstermek için gerekli
    team: true,    // Formda seçili değeri göstermek için gerekli
    projectAssetSettings: {
      orderBy: { asset: { createdAt: 'desc' } } as const,
      include: {
        asset: {
          include: {
            uploader: { select: { username: true } }
          }
        }
      }
    },
  }
};

// --- 2. TİP TANIMLARI ---
// Bu sorgudan dönecek verinin tipini export ediyoruz ki diğer component'ler de kullanabilsin.
export type ProjectForAdmin = Prisma.ProjectGetPayload<typeof projectForAdminQuery>;

// --- 3. VERİ ÇEKME FONKSİYONLARI ---
// Belirli bir projeyi tüm detaylarıyla çeker
async function getProjectForAdmin(projectId: number): Promise<ProjectForAdmin | null> {
  return prisma.project.findUnique({
    where: { id: projectId },
    ...projectForAdminQuery,
  });
}

// Formdaki <select> menülerini doldurmak için tüm Content ve Team listesini çeker
async function getFormData(): Promise<{ allContents: Content[], allTeams: Team[] }> {
    const allContents = await prisma.content.findMany();
    const allTeams = await prisma.team.findMany();
    return { allContents, allTeams };
}

// --- 4. SAYFA BİLEŞENİ (ESKİ YAPIYA BENZETİLMİŞ) ---
export default async function EditProjectPage({ params }: { params: { projectId: string } }) {
  const projectId = parseInt(params.projectId, 10);
  if (isNaN(projectId)) return notFound();

  // Gerekli tüm verileri paralel olarak çekiyoruz
  const [project, formData] = await Promise.all([
      getProjectForAdmin(projectId),
      getFormData()
  ]);
  
  if (!project) return notFound();

  return (
    <AdminPageLayout pageTitle={`Projeyi Düzenle: ${project.name}`}>
        {/* Proje Detaylarını Düzenleme Formu */}
        <div style={{ marginBottom: '40px', padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
            <h2>Proje Detayları</h2>
            <p style={{color: '#aaa', marginTop: '-5px', marginBottom: '20px'}}>Projenin adı, durumu gibi temel bilgilerini buradan güncelleyebilirsiniz.</p>
            <EditProjectForm
                isEditing={true}
                project={project} // Mevcut proje verisini forma gönderiyoruz.
                allContents={formData.allContents}
                allTeams={formData.allTeams}
            />
        </div>

        <hr style={{ margin: '40px 0', borderColor: '#444' }} />

        {/* Asset Yönetim Bileşeni (Eski yapıda da olması gereken kısım) */}
        <div style={{ padding: '20px', background: '#1e1e1e', borderRadius: '8px' }}>
            <h2>Proje Assetleri</h2>
            <p style={{color: '#aaa', marginTop: '-5px', marginBottom: '20px'}}>Bu projeye ait ham dosyaları (ses, metin vb.) buradan yönetebilirsiniz.</p>
            <ManageAssets initialProject={project} />
        </div>
    </AdminPageLayout>
  );
}