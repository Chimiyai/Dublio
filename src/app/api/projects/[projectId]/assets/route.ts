// src/app/api/projects/[projectId]/assets/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// DÜZELTME: Gerekli enum'ları import ediyoruz
import { AssetClassification, AssetType } from '@prisma/client';

export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    const { searchParams } = new URL(request.url);
    const classificationParam = searchParams.get('classification');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 25;

    try {
        const projectId = parseInt(params.projectId, 10);
        
        // Yetki kontrolü (gerekirse eklenebilir)

        // DÜZELTME: Prisma'nın anlayacağı bir `where` koşulu oluşturuyoruz.
        const whereClause: any = {
            projectId: projectId,
            type: AssetType.AUDIO, // `type`'ı doğrudan enum'dan alıyoruz.
        };
        
        // Gelen parametrenin geçerli bir AssetClassification olup olmadığını kontrol et
        if (classificationParam && classificationParam !== 'ALL' && Object.values(AssetClassification).includes(classificationParam as AssetClassification)) {
            whereClause.classification = classificationParam as AssetClassification;
        }

        const assets = await prisma.asset.findMany({
            where: whereClause,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { id: 'desc' },
            include: {
                // `sourcedTranslationLines` ve `referencedTranslationLines` ilişkilerini
                // `Asset` modelinde tanımladığımızdan emin olmalıyız.
                sourcedTranslationLines: {
                    select: { key: true, originalText: true, character: { select: { name: true } } }
                }
            }
        });

        const totalCount = await prisma.asset.count({ where: whereClause });

        return NextResponse.json({
            assets,
            totalPages: Math.ceil(totalCount / limit)
        });

    } catch (error) {
        console.error("[GET_PROJECT_ASSETS_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}