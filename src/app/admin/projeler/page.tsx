import prisma from '@/lib/prisma';
import Link from 'next/link';

// Admin panelindeki proje listesi için tüm projeleri çekelim
async function getAllProjectsForAdmin() {
  return prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      team: { select: { name: true } },
      content: { select: { title: true } },
    }
  });
}

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Proje Yönetimi</h1>
      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #444', padding: '8px' }}>Proje Adı</th>
            <th style={{ border: '1px solid #444', padding: '8px' }}>Ekip</th>
            <th style={{ border: '1px solid #444', padding: '8px' }}>İçerik</th>
            <th style={{ border: '1px solid #444', padding: '8px' }}>Durum</th>
            <th style={{ border: '1px solid #444', padding: '8px' }}>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id}>
              <td style={{ border: '1px solid #444', padding: '8px' }}>{project.name}</td>
              <td style={{ border: '1px solid #444', padding: '8px' }}>{project.team.name}</td>
              <td style={{ border: '1px solid #444', padding: '8px' }}>{project.content.title}</td>
              <td style={{ border: '1px solid #444', padding: '8px' }}>{project.status}</td>
              <td style={{ border: '1px solid #444', padding: '8px', textAlign: 'center' }}>
                <Link href={`/admin/projeler/duzenle/${project.id}`} style={{ color: 'lightblue' }}>
                  Yönet / Düzenle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
