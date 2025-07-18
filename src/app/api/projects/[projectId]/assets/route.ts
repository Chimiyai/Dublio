// src/app/api/projects/[projectId]/assets/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssetClassification, AssetType, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Yetkisiz', { status: 401 });

    const { searchParams } = new URL(request.url);
    const classificationParam = searchParams.get('classification');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const typeParam = searchParams.get('type');

    try {
        const projectId = parseInt(params.projectId, 10);

        const membership = await prisma.teamMember.findFirst({
            where: {
                userId: parseInt(session.user.id),
                team: { projects: { some: { id: projectId } } }
            }
        });
        if (!membership) return new NextResponse('Bu projeye erişim yetkiniz yok', { status: 403 });

        let queryArgs: Prisma.AssetFindManyArgs = {
            where: { projectId: projectId },
            take: limit,
            skip: (page - 1) * limit,
        };
        
        if (classificationParam === 'UNCLASSIFIED') {
            queryArgs.where!.classification = AssetClassification.UNCLASSIFIED;
            queryArgs.where!.type = AssetType.AUDIO;
            queryArgs.orderBy = { id: 'asc' };
        } 
        else if (classificationParam === 'ALL_BUT_UNCLASSIFIED') {
            // CompletedWorkspace'in istediği koşul
            queryArgs.where!.classification = {
                not: AssetClassification.UNCLASSIFIED
            };
            queryArgs.orderBy = { createdAt: 'desc' };

            // NİHAİ DÜZELTME: Hem çeviri satırının kendi bilgilerini,
            // hem de o satıra bağlı karakterin bilgilerini istiyoruz.
            queryArgs.include = {
                referencedTranslationLines: {
                    select: {
                        id: true, // key olarak kullanmak için
                        originalText: true,
                        isNonDialogue: true, // Diyalogsuz olup olmadığını anlamak için
                        character: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            };
        }
        else if (typeParam) {
            queryArgs.where!.type = typeParam as AssetType;
        }

        const assets = await prisma.asset.findMany(queryArgs);
        const totalCount = await prisma.asset.count({ where: queryArgs.where });

        return NextResponse.json({ assets, totalPages: Math.ceil(totalCount / limit) });

    } catch (error) {
        console.error("[GET_PROJECT_ASSETS_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}
