import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { readFile } from 'fs/promises';
import path from 'path';
// DİKKAT: Parser'ları ve tipi doğru şekilde import ediyoruz.
import { parsers, ParserFormat } from '@/lib/parsers';

// Hata ayıklama ve tip güvenliği için parser'dan dönen verinin tipini tanımlayalım.
type ParsedLine = { key: string, originalText: string };

// "İŞLE" BUTONUNA BASILDIĞINDA ÇALIŞACAK API
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

        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) return new NextResponse('Asset bulunamadı', { status: 404 });

        const existingTranslatable = await prisma.translatableAsset.findUnique({ where: { assetId }});
        if (existingTranslatable?.isProcessed) {
            return new NextResponse('Bu dosya zaten işlenmiş.', { status: 409 });
        }
        
        // Body'den formatı alıyoruz
        const body = await request.json();
        const format = body.format as ParserFormat;
        
        // === HATA 1'in ÇÖZÜMÜ BURADA ===
        // Seçilen formatın `parsers` objesinde gerçekten var olup olmadığını kontrol ediyoruz.
        if (!(format in parsers)) {
            return new NextResponse('Desteklenmeyen veya geçersiz format seçildi.', { status: 400 });
        }
        const parser = parsers[format];
        // ================================

        const fullPath = path.join(process.cwd(), 'public', asset.path);
        const fileContent = await readFile(fullPath, 'utf-8');

        const parsedLines: ParsedLine[] = await parser(fileContent as any); // "any" cast'ı farklı parser tipleri için esneklik sağlar

        if (parsedLines.length === 0) {
            return new NextResponse('Dosyadan çevrilecek metin bulunamadı.', { status: 400 });
        }
        
        await prisma.$transaction(async (tx) => {
            // Önce TranslatableAsset kaydını oluştur/bul
            let translatableAsset = existingTranslatable;
            if (!translatableAsset) {
                translatableAsset = await tx.translatableAsset.create({
                    data: { assetId: asset.id, projectId: asset.projectId }
                });
            }
            await tx.translationLine.deleteMany({ where: { assetId: translatableAsset.id }});

            // === HATA 2'nin ÇÖZÜMÜ BURADA ===
            // `line` parametresine açıkça tipini belirtiyoruz.
            await tx.translationLine.createMany({
                data: parsedLines.map((line: ParsedLine) => ({
                    assetId: translatableAsset!.id,
                    key: line.key,
                    originalText: line.originalText,
                }))
            });
            // ================================

            await tx.translatableAsset.update({
                where: { id: translatableAsset.id },
                data: { isProcessed: true }
            });
        });

        return NextResponse.json({ message: `${parsedLines.length} satır başarıyla veritabanına işlendi.` });

    } catch (error) {
        console.error("[ASSET_PARSE_ERROR]", error);
        return new NextResponse('Dosya işlenirken bir hata oluştu.', { status: 500 });
    }
}
