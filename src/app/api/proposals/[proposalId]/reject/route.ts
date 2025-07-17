// src/app/api/proposals/[proposalId]/reject/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(
    request: Request,
    { params }: { params: { proposalId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'ADMIN') {
            return new NextResponse('Yetkisiz', { status: 403 });
        }

        const proposalId = parseInt(params.proposalId, 10);

        await prisma.projectProposal.update({
            where: { id: proposalId },
            data: { status: 'REJECTED' }
        });

        return NextResponse.json({ message: 'Teklif başarıyla reddedildi.' });

    } catch (error) {
        console.error("[PROPOSAL_REJECT_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}