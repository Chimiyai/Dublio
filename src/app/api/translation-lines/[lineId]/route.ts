//src/app/api/translation-lines/[lineId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function DELETE(
    request: Request,
    { params }: { params: { lineId: string } }
) {
    // 1. Oturum Kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }

    try {
        const lineId = parseInt(params.lineId, 10);
        if (isNaN(lineId)) {
            return new NextResponse('Geçersiz Satır ID', { status: 400 });
        }

        // 2. Yetki Kontrolü: Bu kullanıcının bu satırı silme yetkisi var mı?
        // Satırı ve ait olduğu projedeki üyelik durumunu kontrol et.
        const line = await prisma.translationLine.findFirst({
            where: {
                id: lineId,
                sourceAsset: {
                    project: {
                        team: {
                            members: {
                                some: {
                                    userId: parseInt(session.user.id),
                                    role: { in: ['LEADER', 'ADMIN'] }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!line) {
            return new NextResponse('Satır bulunamadı veya bu işlem için yetkiniz yok.', { status: 404 });
        }

        // 3. Silme İşlemi
        await prisma.translationLine.delete({
            where: { id: lineId }
        });

        // Başarılı silme işleminde 204 No Content döndürmek standart bir pratiktir.
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("[DELETE_TRANSLATION_LINE_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}