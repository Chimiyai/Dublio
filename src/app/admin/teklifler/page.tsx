// src/app/admin/teklifler/page.tsx

import prisma from '@/lib/prisma';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import ProposalCard from '@/components/admin/ProposalCard';
import { Prisma } from '@prisma/client';

// Teklifleri çekerken ilişkili oldukları team ve content bilgilerini de alalım.
const proposalWithDetailsQuery = {
    where: {
        status: 'PENDING'
    },
    include: {
        team: {
            select: { name: true, slug: true }
        },
        content: {
            select: { title: true, type: true }
        }
    },
    orderBy: {
        createdAt: 'asc'
    }
} as const;

// Bu sorgudan dönecek verinin tipini oluşturalım.
export type ProposalWithDetails = Prisma.ProjectProposalGetPayload<typeof proposalWithDetailsQuery>;

async function getPendingProposals() {
    return prisma.projectProposal.findMany(proposalWithDetailsQuery);
}

export default async function PendingProposalsPage() {
    const proposals = await getPendingProposals();

    return (
        <AdminPageLayout pageTitle="Bekleyen Proje Teklifleri">
            {proposals.length === 0 ? (
                <p>Onay bekleyen bir proje teklifi bulunmuyor.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {proposals.map(proposal => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                </div>
            )}
        </AdminPageLayout>
    );
}