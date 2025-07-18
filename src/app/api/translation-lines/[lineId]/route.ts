//src/app/api/translation-lines/[lineId]/route.ts]
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { TranslationStatus } from '@prisma/client';

// Bu dosyaya bir PUT fonksiyonu ekliyoruz.
export async function PUT(
  request: Request,
  { params }: { params: { lineId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz', { status: 401 });
    }

    const lineId = parseInt(params.lineId, 10);
    const body = await request.json();
    const { translatedText } = body;

    // Gelen veri kontrolü
    if (typeof translatedText === 'undefined') {
        return new NextResponse('Eksik parametre: translatedText', { status: 400 });
    }
    
    // Yetki Kontrolü (Ekstra Güvenlik): Kullanıcının bu projede yer alıp almadığını kontrol et
    const line = await prisma.translationLine.findUnique({
        where: { id: lineId },
        select: {
            sourceAsset: {
                select: {
                    project: {
                        select: {
                            team: {
                                select: {
                                    members: {
                                        where: { userId: parseInt(session.user.id) }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    
    // Eğer satır bulunamazsa veya kullanıcı o projenin ekibinde değilse, yetkisi yoktur.
    if (!line || line.sourceAsset.project.team.members.length === 0) {
        return new NextResponse('Bu işlem için yetkiniz yok.', { status: 403 });
    }
    
    // Veritabanını güncelle
    const updatedLine = await prisma.translationLine.update({
      where: { id: lineId },
      data: {
        translatedText: translatedText,
        // Mantık: Eğer çeviri metni varsa durumu "Çevrildi" yap, yoksa "Çevrilmedi" olarak kalsın.
        // Bu, çeviriyi silme durumunu da yönetir.
        status: translatedText ? TranslationStatus.TRANSLATED : TranslationStatus.NOT_TRANSLATED,
      },
    });

    // Frontend'in state'i güncelleyebilmesi için güncel satırı geri döndür
    return NextResponse.json(updatedLine);

  } catch (error) {
    console.error(`[TRANSLATION_LINE_PUT_ERROR]`, error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}

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