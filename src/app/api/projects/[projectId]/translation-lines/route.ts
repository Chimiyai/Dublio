//src/app/api/projects/[projectId]/translation-lines/route.ts
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
        const { projectId: projectIdStr } = params;
        const projectId = parseInt(projectIdStr, 10);

        // TODO: Kullanıcının bu projeye erişim yetkisi olup olmadığını kontrol et.

        const translationLines = await prisma.translationLine.findMany({
            where: {
                sourceAsset: {
                    projectId: projectId,
                },
            },
        });

        return NextResponse.json(translationLines);

    } catch (error) {
        console.error("[GET_TRANSLATION_LINES_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}