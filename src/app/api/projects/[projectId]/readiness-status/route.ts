// src/app/api/projects/[projectId]/readiness-status/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }

    try {
        const projectId = parseInt(params.projectId, 10);

        // Yetki kontrolü: Kullanıcı en azından projenin ekibinde olmalı.
        const membership = await prisma.teamMember.findFirst({
            where: {
                userId: parseInt(session.user.id),
                team: {
                    projects: { some: { id: projectId } }
                }
            }
        });

        if (!membership) {
            return new NextResponse('Bu projenin durumunu görme yetkiniz yok.', { status: 403 });
        }
        
        // DÜZENLEME: Sorguya "type: 'AUDIO'" filtresini ekliyoruz.
        const unclassifiedAssetCount = await prisma.asset.count({
            where: {
                projectId: projectId,
                classification: 'UNCLASSIFIED',
                type: 'AUDIO', // <<< Sadece ses dosyalarını say!
            },
        });

        // Projenin mevcut durumunu al
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { isReadyForTranslation: true }
        });

        if (!project) {
            return new NextResponse('Proje bulunamadı', { status: 404 });
        }

        return NextResponse.json({
            unclassifiedAssetCount,
            isReadyForTranslation: project.isReadyForTranslation,
        });

    } catch (error) {
        console.error("[GET_READINESS_STATUS_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}
