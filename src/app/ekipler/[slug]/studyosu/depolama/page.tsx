// src/app/ekipler/[slug]/studyosu/depolama/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TeamStorageManager from '@/components/teams/TeamStorageManager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Veri çeken fonksiyon
async function getTeamStorageData(teamSlug: string, userId: number) {
    const team = await prisma.team.findUnique({
        where: { slug: teamSlug },
        include: {
            // Ekibin mevcut depolama alanlarını çek
            storages: true,
            // Yetki kontrolü için üyeleri çek
            members: {
                where: { userId: userId },
                select: { role: true }
            }
        }
    });

    return team;
}

export default async function TeamStoragePage({ params }: { params: { slug: string }}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound(); // Giriş yapmamışsa erişemez

    const team = await getTeamStorageData(params.slug, parseInt(session.user.id));

    // Ekip yoksa veya kullanıcı üye değilse erişemez
    if (!team || team.members.length === 0) return notFound();

    // Sadece Liderler veya Adminler erişebilir
    const isAuthorized = team.members[0].role === 'LEADER' || team.members[0].role === 'ADMIN';
    if (!isAuthorized) {
        return <p>Bu sayfayı sadece ekip liderleri ve adminler görebilir.</p>;
    }

    return (
        <div>
            <h1>Depolama Yönetimi</h1>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>
                Proje dosyalarınızın saklanacağı bulut depolama çözümlerini (Google Drive, OneDrive vb.) buradan yönetin.
            </p>
            <TeamStorageManager team={team} />
        </div>
    );
}