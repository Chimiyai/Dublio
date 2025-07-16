// src/app/projeler/[projectId]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { Prisma, InteractionType } from '@prisma/client'; 
import TaskBoard from '@/components/projects/TaskBoard';

import ProjectDetailContent from '@/components/projects/ProjectDetailContent';

export interface UserInteractionData {
    isLoggedIn: boolean;
    liked: boolean;
    favorited: boolean;
}

// projectDetailQuery'ye görevleri de dahil edelim
const projectDetailQuery = {
  include: {
    team: { 
        select: { 
            name: true, 
            slug: true,
            members: { 
                include: { 
                    user: {
                        select: { 
                            id: true, // <-- EKSİK OLANI EKLEDİK
                            username: true,
                            profileImage: true // Profil resmini de alalım, ileride lazım olur.
                        }
                    }
                } 
            }
        } 
    },
    content: true,
    tasks: {
        include: {
            assignees: {
                include: { user: { select: { username: true, profileImage: true } } }
            }
        },
        orderBy: { createdAt: 'asc' as const }
    }
  }
};

// Bu tip tanımları doğru, onlara dokunmuyoruz.
export type ProjectWithDetailsForStudio = Prisma.ProjectGetPayload<typeof projectDetailQuery> & {
    interactions: { userId: number; type: InteractionType; }[];
};
export type ProjectWithDetailsForPublic = Omit<ProjectWithDetailsForStudio, 'tasks'>;

// 3. Veri çekme fonksiyonumuz (yeni şemaya göre)
async function getProjectDetails(projectId: number): Promise<ProjectWithDetailsForStudio | null> {
    const projectPromise = prisma.project.findUnique({
        where: { id: projectId },
        ...projectDetailQuery
    });
    const interactionsPromise = prisma.interaction.findMany({
        where: { targetType: 'PROJECT', targetId: projectId },
        select: { userId: true, type: true }
    });
    const [project, interactions] = await Promise.all([projectPromise, interactionsPromise]);
    if (!project) return null;
    return { ...project, interactions };
}

async function getUserSpecificData(userId: number | undefined, projectId: number): Promise<Omit<UserInteractionData, 'isLoggedIn'>> {
    if (!userId) return { liked: false, favorited: false };

    const interactions = await prisma.interaction.findMany({
        where: {
            userId: userId,
            targetId: projectId,
            targetType: 'PROJECT',
            type: { in: ['LIKE', 'FAVORITE'] },
        }
    });

    return {
        liked: interactions.some(i => i.type === 'LIKE'),
        favorited: interactions.some(i => i.type === 'FAVORITE'),
    };
}


// 5. Ana Sayfa Bileşeni (Sunucu)
export default async function ProjectDetailPageServer({ params }: { params: { projectId: string } }) {
  const projectIdString = params.projectId; // 'params.slug' yerine 'params.projectId'
  const projectId = parseInt(projectIdString, 10);
  if (isNaN(projectId)) notFound();

  const session = await getServerSession(authOptions);
  const project = await getProjectDetails(projectId); // Fonksiyon zaten ID alıyordu, bu doğru.
  if (!project) notFound();

  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;
  const userInteractionStatus = await getUserSpecificData(userId, project.id);
  const viewerMembership = session?.user ? project.team.members.find(m => m.userId === userId) : null;
  
  // === HATA 1'in ÇÖZÜMÜ BURADA ===
  // Tüm JSX'i tek bir kapsayıcı içine alıyoruz
  return (
    <div>
      {/* Herkesin gördüğü genel proje vitrini */}
      <ProjectDetailContent
        project={project}
        userInteraction={{
          isLoggedIn: !!userId,
          ...userInteractionStatus
        }}
      />

      <hr style={{margin: '40px 0', borderColor: '#444'}}/>

      {/* Sadece ekip üyelerinin gördüğü Proje Stüdyosu */}
      {viewerMembership ? (
          <div style={{padding: '20px'}}>
            <TaskBoard 
                initialTasks={project.tasks} 
                teamMembers={project.team.members}
                viewerRole={viewerMembership.role}
                projectId={project.id}
            />
          </div>
      ) : (
          <div style={{textAlign: 'center', padding: '40px', color: 'gray'}}>
            <p>Bu projenin çalışma alanını görmek için ekip üyesi olmalısınız.</p>
          </div>
      )}
    </div>
  );
}
