//src/app/api/assets/[assetId]/undo/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { AssetClassification } from '@prisma/client';

export async function POST(
    request: Request,
    { params }: { params: { assetId: string } }
) {
    // 1. Oturum Kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }
    
    try {
        const assetId = parseInt(params.assetId, 10);
        if (isNaN(assetId)) {
            return new NextResponse('Geçersiz Asset ID', { status: 400 });
        }

        // 2. Yetki Kontrolü: Bu kullanıcının bu asset üzerinde işlem yapma yetkisi var mı?
        const asset = await prisma.asset.findFirst({
            where: {
                id: assetId,
                project: {
                    team: {
                        members: {
                            some: { 
                                userId: parseInt(session.user.id),
                                // Genellikle sadece liderler veya adminler bu tür işlemleri yapabilir.
                                // İstersen 'MODDER' rolünü de ekleyebilirsin.
                                role: { in: ['LEADER', 'ADMIN'] } 
                            }
                        }
                    }
                }
            }
        });

        if (!asset) {
            return new NextResponse('Asset bulunamadı veya bu işlem için yetkiniz yok.', { status: 404 });
        }

        // 3. Veritabanı İşlemleri (Transaction içinde)
        // Transaction, işlemlerden biri başarısız olursa tümünü geri alarak veri bütünlüğünü korur.
        await prisma.$transaction(async (tx) => {
            // Bu sese referans veren TÜM çeviri satırlarının bağlantısını kopar (ID'lerini null yap).
            // Bu, hem diyaloglar hem de (eğer silinmemişse) diyalogsuzlar için çalışır.
            await tx.translationLine.updateMany({
                where: { originalVoiceReferenceAssetId: assetId },
                data: { originalVoiceReferenceAssetId: null }
            });
            
            // Asset'in kendisini "Sınıflandırılmamış" yap.
            await tx.asset.update({
                where: { id: assetId },
                data: { classification: AssetClassification.UNCLASSIFIED },
            });
        });

        return NextResponse.json({ message: 'Geri alma işlemi başarılı.' });

    } catch (error) {
        console.error("[UNDO_ASSET_ACTION_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}