//src/app/api/modder-studio/[projectId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { projectForModderQuery } from '@/types/modder';

export async function GET(
    request: Request,
    context: { params: { projectId: string } }
) {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }

    try {
        const projectId = parseInt(params.projectId, 10);

        // DÜZELTME: Sorguyu artık buradan alıyoruz
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            ...projectForModderQuery
        });

        if (!project) {
            return new NextResponse('Proje bulunamadı', { status: 404 });
        }

        // Yetki Kontrolü: Kullanıcı bu ekibin üyesi mi?
        const isMember = project.team.members.some(m => m.userId === parseInt(session.user.id));
        if (!isMember) {
            return new NextResponse('Bu projeyi görüntüleme yetkiniz yok', { status: 403 });
        }

        return NextResponse.json(project);

    } catch (error) {
        console.error("[GET_MODDER_STUDIO_DATA_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}