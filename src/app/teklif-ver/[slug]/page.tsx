// src/app/teklif-ver/[slug]/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import ProposalForm from '@/components/proposals/ProposalForm';
import { Prisma } from '@prisma/client';

// Veri çeken fonksiyon
async function getProposalData(contentSlug: string, userId: number) {
    // Talip olunacak içeriği bul
    const content = await prisma.content.findUnique({
        where: { slug: contentSlug },
    });

    if (!content) return { content: null, leaderOfTeams: [] };

    // Kullanıcının lider olduğu ekipleri ve o ekiplerin depolama alanlarını çek
    const leaderOfTeams = await prisma.team.findMany({
        where: {
            members: {
                some: { userId: userId, role: 'LEADER' }
            }
        },
        include: {
            // Her ekibin depolama alanlarını da yanında getir
            storages: true,
        }
    });

    return { content, leaderOfTeams };
}

export type TeamsWithStorages = Prisma.PromiseReturnType<typeof getProposalData>['leaderOfTeams'];

export default async function ProposeProjectPage({ params }: { params: { slug: string }}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return notFound(); // Sadece giriş yapmış kullanıcılar

    const { content, leaderOfTeams } = await getProposalData(params.slug, parseInt(session.user.id));

    if (!content) return notFound(); // İçerik bulunamadıysa 404
    if (leaderOfTeams.length === 0) {
        return (
            <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>
                <h1>Erişim Reddedildi</h1>
                <p>Projelere talip olabilmek için bir ekibin lideri olmalısınız.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', color: 'white' }}>
            <h1>Proje Teklifi Oluştur</h1>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>
                <strong>{content.title}</strong> projesini yerelleştirmek için teklifinizi gönderin.
            </p>
            <ProposalForm content={content} teams={leaderOfTeams} />
        </div>
    );
}