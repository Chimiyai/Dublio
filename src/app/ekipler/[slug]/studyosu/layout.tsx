//src/app/ekipler/[slug]/studyosu/layout.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Link from 'next/link';
import { ReactNode } from 'react';

// Bu fonksiyonu layout'a taşıyoruz, çünkü tüm alt sayfalarda bu veriye ihtiyacımız olacak.
async function getTeamForLayout(slug: string, userId: number) {
    const team = await prisma.team.findUnique({
        where: { slug },
        include: {
            members: {
                where: { userId: userId },
                select: { role: true }
            },
            projects: {
                where: { status: { not: 'COMPLETED' } },
                include: { content: { select: { title: true } } }
            }
        }
    });
    return team;
}

export default async function TeamStudioLayout({
    children,
    params
}: {
    children: ReactNode;
    params: { slug: string };
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound();

    const userId = parseInt(session.user.id);
    const team = await getTeamForLayout(params.slug, userId);

    if (!team || team.members.length === 0) {
        return (
            <div>
                <h1>Erişim Reddedildi</h1>
                <p>Bu stüdyoyu görmek için bu ekibin bir üyesi olmalısınız.</p>
            </div>
        );
    }
    
    const viewerRole = team.members[0].role;

    return (
        <div style={{ display: 'flex', color: 'white', background: '#18191E', minHeight: '100vh' }}>
            {/* Sol Navigasyon Menüsü (Artık Ortak) */}
            <aside style={{ width: '240px', background: '#111214', padding: '20px', flexShrink: 0 }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>{team.name} Stüdyosu</h2>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link href={`/ekipler/${team.slug}/studyosu`}>Ana Panel</Link>
                    <Link href="#"># genel-sohbet (Yakında)</Link>
                    <hr />
                    <strong>PROJELER</strong>
                    {team.projects.map(project => (
                        <Link key={project.id} href={`/ekipler/${team.slug}/studyosu/projeler/${project.id}`}>
                           # {project.content.title}
                        </Link>
                    ))}
                    {viewerRole === 'LEADER' && <Link href="/projeler/yeni" style={{color: 'lightblue'}}>+ Yeni Proje Başlat</Link>}
                </nav>
            </aside>

            {/* Ana İçerik Alanı (Alt sayfalar buraya render edilecek) */}
            <main style={{ flex: 1, padding: '20px', overflowX: 'auto' }}>
                {children}
            </main>
        </div>
    );
}