import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';
// Project, DubbingArtist ve RoleInProject tiplerini import et
import { Project, DubbingArtist, RoleInProject, ProjectAssignment } from '@prisma/client'; 
// Form bileşeninin doğru yolunu kontrol et
import EditProjectForm from '@/components/admin/EditProjectForm'; 

// Props tipi
interface EditProjectPageProps {
  params: {
    slug: string;
  };
}

// generateMetadata fonksiyonu (opsiyonel, güncellenebilir)
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const project = await prisma.project.findUnique({
    where: { slug: slug },
    select: { title: true }, // Sadece başlığı çekmek yeterli
  });

  if (!project) {
    return { title: 'Proje Bulunamadı | Admin Paneli' };
  }
  return {
    title: `Düzenle: ${project.title} | Admin Paneli`,
  };
}


export default async function EditProjectPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  // Hem projeyi (atamalarıyla birlikte) hem de TÜM sanatçıları çek
  const [projectData, allArtists] = await Promise.all([
    prisma.project.findUnique({
      where: { slug: slug },
      include: { 
         // --- GÜNCELLEME: role alanını da seç ---
         assignments: { 
           select: { 
              artistId: true,
              role: true // Rol bilgisini de çekiyoruz
           }
         }
         // --------------------------------------
      }
    }),
    prisma.dubbingArtist.findMany({ // Tüm sanatçıları forma göndermek için
      orderBy: { firstName: 'asc' } 
    })
  ]);

  // Proje bulunamazsa 404 göster
  if (!projectData) {
    notFound();
  }
  
  // Veri dönüşümüne artık gerek yok, projectData doğrudan kullanılabilir.
  // Önceki dönüşüm kodları silindi.

  // RoleInProject enum değerlerini alıp forma göndereceğiz
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
      <div className="max-w-4xl mx-auto"> {/* Form için alan */}
        <EditProjectForm
          // --- GÜNCELLEME: Doğrudan projectData gönder ---
          project={projectData} // İçinde assignments: { artistId, role }[] var
          // ----------------------------------------------
          allArtists={allArtists} 
          availableRoles={availableRoles} // Rol seçeneklerini de gönder
        />
      </div>
    </div>
  );
}
