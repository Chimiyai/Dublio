// src/app/api/projects/[projectId]/assets/next-unclassified/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { AssetClassification } from '@prisma/client';

export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const projectId = parseInt(params.projectId, 10);

        if (!session?.user?.id || isNaN(projectId)) {
            return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
        }
        
        const membership = await prisma.teamMember.findFirst({
            where: {
                userId: parseInt(session.user.id),
                team: { projects: { some: { id: projectId } } }
            }
        });

        if (!membership) {
            return new NextResponse('Bu projeye erişim yetkiniz yok', { status: 403 });
        }
        
        const nextAsset = await prisma.asset.findFirst({
            where: {
                projectId: projectId,
                type: 'AUDIO',
                classification: AssetClassification.UNCLASSIFIED
            },
            orderBy: { id: 'asc' }
        });
        
        const totalAudioAssets = await prisma.asset.count({ where: { projectId: projectId, type: 'AUDIO' } });
        const remainingAssets = await prisma.asset.count({ where: { projectId: projectId, type: 'AUDIO', classification: AssetClassification.UNCLASSIFIED } });

        return NextResponse.json({
            nextAsset,
            progress: {
                total: totalAudioAssets,
                remaining: remainingAssets,
                completed: totalAudioAssets - remainingAssets
            }
        });
    } catch (error) {
        console.error("[GET_NEXT_UNCLASSIFIED_ASSET_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}