//src/app/ekipler/[slug]/studyosu/projeler/[projectId]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import TaskBoard from '@/components/projects/TaskBoard';
import Link from 'next/link';

// Bu sayfa için gerekli veriyi, yani projenin görevlerini ve ekip üyelerini çekelim.
async function getProjectDataForStudio(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: { select: { id: true, username: true, profileImage: true } }
            }
          }
        }
      },
      content: { select: { title: true } },
      tasks: {
        include: {
          assignees: {
            include: { user: { select: { username: true, profileImage: true } } }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  return project;
}

export default async function ProjectWorkspacePage({ params }: { params: { projectId: string, slug: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();

    const session = await getServerSession(authOptions);
    const project = await getProjectDataForStudio(projectId);

    if (!project) return notFound();
    
    // Yetki kontrolü (Layout'ta zaten yapılıyor ama burada da yapmak daha güvenli)
    const viewerMembership = session?.user ? project.team.members.find(m => m.userId === parseInt(session.user!.id)) : null;
    if(!viewerMembership) return <div>Erişim Reddedildi.</div>

    return (
        <div>
            <h1>{project.content.title} Projesi</h1>
            <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
                <Link href={`/ekipler/${params.slug}/studyosu/projeler/${projectId}/ceviri`} style={{color: 'lightblue'}}>
                    Çeviri Atölyesi
                </Link>
                <Link href="#" style={{color: 'gray'}}>Dublaj Atölyesi (Yakında)</Link>
            </div>
            
            <TaskBoard 
                initialTasks={project.tasks} 
                teamMembers={project.team.members}
                viewerRole={viewerMembership.role}
                projectId={project.id}
            />
        </div>
    );
}