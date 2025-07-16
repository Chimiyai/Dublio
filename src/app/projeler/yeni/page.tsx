//src/app/projeler/yeni/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import NewProjectForm from '@/components/projects/NewProjectForm'; // İstemci bileşenimiz

// Gerekli verileri çekmek için bir sunucu fonksiyonu
async function getNewProjectData(userId: number) {
    // 1. Kullanıcının LİDER olduğu ekipleri bul
    const leadTeams = await prisma.team.findMany({
        where: {
            members: {
                some: {
                    userId: userId,
                    role: 'LEADER',
                }
            }
        }
    });

    // 2. Henüz bir projeye atanmamış olan içerikleri bul
    const availableContents = await prisma.content.findMany({
        where: {
            projects: {
                none: {} // Hiç projesi olmayanları getir
            }
        }
    });

    return { leadTeams, availableContents };
}

export default async function NewProjectPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect('/giris');
    }

    const { leadTeams, availableContents } = await getNewProjectData(parseInt(session.user.id));
    
    // Eğer kullanıcının lideri olduğu bir ekip yoksa, bu sayfayı göstermenin anlamı yok.
    if (leadTeams.length === 0) {
        return (
            <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>
                <h1>Proje Başlatamazsınız</h1>
                <p>Yeni bir proje başlatabilmek için bir ekibin Lideri olmalısınız.</p>
            </div>
        );
    }

    return (
        <NewProjectForm 
            teams={leadTeams}
            contents={availableContents}
        />
    );
}