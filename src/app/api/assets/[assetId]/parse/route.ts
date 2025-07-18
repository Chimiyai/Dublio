//src/app/api/assets/[assetId]/parse/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { getParser } from '@/lib/parsers'; // Bizim parser dağıtıcımız
import path from 'path';
import fs from 'fs/promises';
import { Prisma } from '@prisma/client';

// Gelen isteğin gövdesini doğrulamak için Zod şeması
const parseSchema = z.object({
  format: z.string().min(1, { message: "Format belirtilmeli." }),
});

export async function POST(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    try {
        // 1. Oturum ve Parametre Kontrolü
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Yetkisiz', { status: 401 });
        }
        
        const { assetId: assetIdStr } = params;
        const assetId = parseInt(assetIdStr, 10);

        if (isNaN(assetId)) {
            return new NextResponse('Geçersiz Asset ID', { status: 400 });
        }

        // 2. Asset'i Bulma ve Yetki Kontrolü
        const asset = await prisma.asset.findFirst({
            where: {
                id: assetId,
                type: 'TEXT', // Sadece metin dosyaları ayrıştırılabilir
                project: {
                    team: {
                        members: {
                            some: { userId: parseInt(session.user.id) }
                        }
                    }
                }
            }
        });
        
        if (!asset) {
            return new NextResponse('Ayrıştırılacak metin asseti bulunamadı veya yetkiniz yok.', { status: 404 });
        }

        // 3. İstek Gövdesini ve Formatı Doğrulama
        const body = await request.json();
        const validation = parseSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ message: 'Geçersiz istek', errors: validation.error.flatten() }, { status: 400 });
        }
        const { format } = validation.data;

        // 4. Doğru Ayrıştırıcıyı Seçme
        const parser = getParser(format);
        if (!parser) {
            return NextResponse.json({ message: `Desteklenmeyen format: ${format}` }, { status: 400 });
        }
        
        // 5. Dosyayı Fiziksel Olarak Okuma
        const filePath = path.join(process.cwd(), 'public', asset.path);
        const fileContent = await fs.readFile(filePath, 'utf8');

        // 6. Seçilen Ayrıştırıcı ile Dosya İçeriğini İşleme
        const parsedLines = await parser(fileContent);

        if (parsedLines.length === 0) {
            return NextResponse.json({ message: "Dosya içinde ayrıştırılacak veri bulunamadı.", count: 0 });
        }

        // 7. Veritabanında Zaten Var Olan Satırları Filtreleme
        const potentialKeys = parsedLines.map(p => p.key);
        const existingLines = await prisma.translationLine.findMany({
            where: {
                sourceAssetId: asset.id,
                key: { in: potentialKeys },
            },
            select: { key: true },
        });
        const existingKeySet = new Set(existingLines.map(k => k.key));

        const linesToCreate = parsedLines
            .filter(p => !existingKeySet.has(p.key))
            .map(p => ({
                sourceAssetId: asset.id,
                key: p.key,
                originalText: p.originalText,
            }));

        if (linesToCreate.length === 0) {
            return NextResponse.json({ message: "Yeni çeviri satırı eklenmedi. Tüm satırlar zaten mevcut.", count: 0 });
        }
        
        // 8. Yeni Satırları Veritabanına Ekleme
        const result = await prisma.translationLine.createMany({
            data: linesToCreate,
        });

        return NextResponse.json({ message: "Ayrıştırma başarılı.", count: result.count });

    } catch (error) {
        console.error("[ASSET_PARSE_ERROR]", error);
        if (error instanceof SyntaxError) {
            return new NextResponse('Dosya içeriği geçerli bir formatta değil. (JSON Hatası)', { status: 400 });
        }
        
        // Prisma hatası olup olmadığını kontrol et
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Artık 'error.code' gibi özelliklere güvenle erişebiliriz
            if (error.code === 'P2002') {
                 return new NextResponse('Benzersizlik kuralı ihlali. Bu satırlar zaten eklenmiş olabilir.', { status: 409 });
            }
        }

        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}
