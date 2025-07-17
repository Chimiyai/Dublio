// src/app/api/admin/assets/[assetId]/parse/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readFile } from 'fs/promises';
import path from 'path';
import { parsers, ParserFormat } from '@/lib/parsers';

type ParsedLine = { key: string, originalText: string };

export async function POST(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'ADMIN') {
            return new NextResponse('Yetkisiz', { status: 403 });
        }
        const assetId = parseInt(params.assetId, 10);
        if (isNaN(assetId)) return new NextResponse('Geçersiz Asset ID', { status: 400 });

        const body = await request.json();
        // DÜZELTME: projectId'yi artık body'den alıyoruz.
        const projectId = body.projectId as number;
        const format = body.format as ParserFormat;

        if (!projectId || !format) {
            return new NextResponse('Eksik bilgi: projectId ve format gereklidir', { status: 400 });
        }
        
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) return new NextResponse('Asset bulunamadı', { status: 404 });

        // Bu asset için daha önce oluşturulmuş bir TranslatableAsset var mı kontrol et.
        const existingTranslatable = await prisma.translatableAsset.findUnique({ where: { assetId }});

        // Body'den formatı al
        if (!projectId) {
            return new NextResponse('Proje ID eksik', { status: 400 });
        }
        
        if (!(format in parsers)) {
            return new NextResponse('Desteklenmeyen veya geçersiz format seçildi.', { status: 400 });
        }
        const fullPath = path.join(process.cwd(), 'public', asset.path);
        const fileContent = await readFile(fullPath, 'utf-8');
        const parser = parsers[format];
        const parsedLines: ParsedLine[] = await parser(fileContent as any);

        if (parsedLines.length === 0) {
            return new NextResponse('Dosyadan çevrilecek metin bulunamadı.', { status: 400 });
        }
        
        await prisma.$transaction(async (tx) => {
            const existingTranslatable = await tx.translatableAsset.findUnique({ where: { assetId }});

            let translatableAssetRecord = existingTranslatable;
            if (!translatableAssetRecord) {
                // DÜZELTME: projectId'yi asset'ten değil, body'den gelen değişkenden alıyoruz.
                translatableAssetRecord = await tx.translatableAsset.create({
                    data: { assetId: asset.id, projectId: projectId }
                });
            }
            
            await tx.translationLine.deleteMany({ where: { sourceAssetId: asset.id }});

            if (parsedLines.length > 0) {
                 await tx.translationLine.createMany({
                    data: parsedLines.map((line: ParsedLine) => ({
                        sourceAssetId: asset.id,
                        key: line.key,
                        originalText: line.originalText,
                    }))
                });
            }
           
            await tx.translatableAsset.update({
                where: { id: translatableAssetRecord.id },
                data: { isProcessed: true }
            });
        });

        return NextResponse.json({ message: `${parsedLines.length} satır başarıyla işlendi.` });

    } catch (error) {
        console.error("[ASSET_PARSE_ERROR]", error);
        return new NextResponse('Dosya işlenirken bir hata oluştu.', { status: 500 });
    }
}
