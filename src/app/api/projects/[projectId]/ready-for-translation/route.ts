//src/app/api/projects/[projectId]/ready-for-translation/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }

    try {
        const projectId = parseInt(params.projectId, 10);

        // Yetki Kontrolü: Sadece proje ekibinin lideri veya admini bu işlemi yapabilsin.
        const membership = await prisma.teamMember.findFirst({
            where: {
                userId: parseInt(session.user.id),
                team: {
                    projects: { some: { id: projectId } }
                },
                role: { in: ['LEADER', 'ADMIN'] } // Sadece Lider ve Adminler
            }
        });

        if (!membership) {
            return new NextResponse('Bu işlemi yapma yetkiniz yok.', { status: 403 });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { isReadyForTranslation: true },
        });

        return NextResponse.json(updatedProject);

    } catch (error) {
        console.error("[SET_READY_FOR_TRANSLATION_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}