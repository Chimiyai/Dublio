// src/app/api/assets/[assetId]/parse/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import path from 'path';

// === DÜZELTME: Modüler parser yapımızı import ediyoruz ===
import { parsers, type ParserFormat } from '@/lib/parsers';

// Gelen isteğin body'sini doğrulamak için Zod şeması
// `keyof typeof parsers` ile, Zod'un sadece `parsers` objesindeki anahtarları kabul etmesini sağlıyoruz.
const parseSchema = z.object({
  format: z.enum(Object.keys(parsers) as [ParserFormat, ...ParserFormat[]]),
});

type ParsedLine = { key: string, originalText: string };

export async function POST(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Yetkisiz', { status: 401 });
        }
        
        const assetId = parseInt(params.assetId, 10);

        // Yetki Kontrolü...
        const asset = await prisma.asset.findFirst({
            where: {
                id: assetId,
                type: 'TEXT',
                project: {
                    team: {
                        members: { some: { userId: parseInt(session.user.id), role: { in: ['LEADER', 'ADMIN', 'MODDER'] } } }
                    }
                }
            }
        });

        if (!asset) {
            return new NextResponse('İşlenecek metin asseti bulunamadı veya yetkiniz yok.', { status: 404 });
        }

        const body = await request.json();
        const validation = parseSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Geçersiz veri veya desteklenmeyen format.', errors: validation.error.flatten() }, { status: 400 });
        }
        
        // === DÜZELTME: Dinamik parser seçimi ===
        const { format } = validation.data;
        const parser = parsers[format]; // `parsers` objesinden doğru fonksiyonu seçiyoruz.

        // Dosyayı sunucudan oku
        const fullPath = path.join(process.cwd(), 'public', asset.path);
        const fileContent = await readFile(fullPath, 'utf-8');

        // Seçilen parser fonksiyonunu çağır ve dosya içeriğini ona gönder
        const parsedLines: ParsedLine[] = await parser(fileContent);

        if (parsedLines.length === 0) {
            return NextResponse.json({ message: 'Dosyadan çevrilecek metin bulunamadı veya format uyumsuz.' }, { status: 400 });
        }

        // Transaction ile veritabanı işlemleri (bu kısım aynı kalıyor)
        await prisma.$transaction(async (tx) => {
            await tx.translationLine.deleteMany({
                where: { sourceAssetId: assetId } 
            });
            await tx.translationLine.createMany({
                data: parsedLines.map(line => ({
                    sourceAssetId: assetId,
                    key: line.key,
                    originalText: line.originalText,
                }))
            });
        });

        return NextResponse.json({ message: `${parsedLines.length} satır başarıyla işlendi ve veritabanına eklendi.` });

    } catch (error) {
        console.error("[ASSET_PARSE_ERROR]", error);
        if (error instanceof SyntaxError) {
            return new NextResponse('Dosya içeriği seçilen formatla uyumlu değil (JSON/Format Hatası).', { status: 400 });
        }
        return new NextResponse('Dosya işlenirken bir hata oluştu.', { status: 500 });
    }
}