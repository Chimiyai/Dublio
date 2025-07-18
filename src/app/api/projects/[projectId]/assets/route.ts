// src/app/api/projects/[projectId]/assets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssetClassification } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { AssetType, Prisma } from '@prisma/client';

export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    const { projectId: projectIdStr } = params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Yetkisiz', { status: 401 });

    const { searchParams } = new URL(request.url);
    // Artık 'classification' parametresini sorgu için kullanacağız
    const classificationParam = searchParams.get('classification');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10); // Sınırı 50 yapalım
    const typeParam = searchParams.get('type');

    try {
        const projectId = parseInt(params.projectId, 10);

        // Yetki kontrolü
        const membership = await prisma.teamMember.findFirst({
            where: {
                userId: parseInt(session.user.id),
                team: { projects: { some: { id: projectId } } }
            }
        });
        if (!membership) return new NextResponse('Bu projeye erişim yetkiniz yok', { status: 403 });

        let queryArgs: Prisma.AssetFindManyArgs = {
            where: {
                projectId: projectId,
            },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' },
        };

        if (classificationParam === 'ALL_BUT_UNCLASSIFIED') {
            queryArgs.where!.classification = {
                not: AssetClassification.UNCLASSIFIED
            };
            // YENİ VE KRİTİK KISIM: İlgili çeviri satırını da veriye dahil et
            queryArgs.include = {
                referencedTranslationLines: {
                    select: {
                        originalText: true,
                        character: { // Karakter adını da alalım, bonus!
                            select: { name: true }
                        }
                    }
                }
            };
        } else if (typeParam && Object.values(AssetType).includes(typeParam as AssetType)) {
            queryArgs.where!.type = typeParam as AssetType;
        }

        const assets = await prisma.asset.findMany(queryArgs);

        const totalCount = await prisma.asset.count({ where: queryArgs.where });

        return NextResponse.json({
            assets,
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error("[GET_PROJECT_ASSETS_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}
