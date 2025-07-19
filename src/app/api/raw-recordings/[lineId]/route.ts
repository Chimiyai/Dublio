//src/api/raw-recordings/[lineId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { VoiceRecordingStatus } from '@prisma/client';
import { unlink } from 'fs/promises'; // Dosya silmek için
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: { lineId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
    }

    try {
        const lineId = parseInt(params.lineId, 10);
        if (isNaN(lineId)) {
            return NextResponse.json({ message: 'Geçersiz ID' }, { status: 400 });
        }

        // 1. Geri alınacak ham kaydı bul (dosya yolunu almak için)
        const rawRecording = await prisma.rawVoiceRecording.findUnique({
            where: { lineId: lineId }
        });

        // 2. Fiziksel dosyayı diskten sil (eğer kayıt varsa)
        if (rawRecording && rawRecording.url) {
            try {
                const filePath = path.join(process.cwd(), 'public', rawRecording.url);
                await unlink(filePath);
            } catch (fileError: any) {
                // Dosya zaten yoksa bu bir hata değil, sadece logla ve devam et.
                if (fileError.code !== 'ENOENT') {
                    console.error("Dosya silinirken hata oluştu:", fileError);
                }
            }
        }
        
        // 3. Veritabanı işlemlerini transaction içinde yap (ikisi de başarılı olmalı)
        await prisma.$transaction([
            // 3a. RawVoiceRecording kaydını sil
            prisma.rawVoiceRecording.delete({
                where: { lineId: lineId }
            }),
            // 3b. TranslationLine durumunu PENDING_RECORDING'e geri döndür
            prisma.translationLine.update({
                where: { id: lineId },
                data: {
                    recordingStatus: VoiceRecordingStatus.PENDING_RECORDING
                }
            })
        ]);

        return NextResponse.json({ message: 'Kayıt başarıyla geri alındı.' }, { status: 200 });

    } catch (error: any) {
        console.error("[RAW_RECORDING_DELETE_ERROR]", error);
        // Eğer kayıt zaten silinmişse P2025 hatası döner, bunu görmezden gelebiliriz.
        if (error.code === 'P2025') {
            return NextResponse.json({ message: 'Kayıt zaten geri alınmış olabilir.' }, { status: 200 });
        }
        return NextResponse.json({ message: 'Sunucu Hatası', error: error.message }, { status: 500 });
    }
}