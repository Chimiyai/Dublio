
//src/app/api/mix-recordings/[lineId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { VoiceRecordingStatus } from '@prisma/client';
import { unlink } from 'fs/promises';
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

        // 1. Geri alınacak satırı bul (dosya yolunu almak için)
        const lineToUndo = await prisma.translationLine.findUnique({
            where: { id: lineId },
            select: { voiceRecordingUrl: true }
        });

        // 2. Fiziksel dosyayı diskten sil
        if (lineToUndo && lineToUndo.voiceRecordingUrl) {
            try {
                const filePath = path.join(process.cwd(), 'public', lineToUndo.voiceRecordingUrl);
                await unlink(filePath);
            } catch (fileError: any) {
                if (fileError.code !== 'ENOENT') console.error("Dosya silinirken hata:", fileError);
            }
        }
        
        // 3. Veritabanındaki satırı güncelle: Durumu PENDING_MIX'e geri çek ve URL'i temizle
        const updatedLine = await prisma.translationLine.update({
            where: { id: lineId },
            data: {
                recordingStatus: VoiceRecordingStatus.PENDING_MIX,
                voiceRecordingUrl: null
            }
        });

        return NextResponse.json(updatedLine);

    } catch (error: any) {
        console.error("[MIX_RECORDING_DELETE_ERROR]", error);
        return NextResponse.json({ message: 'Sunucu Hatası' }, { status: 500 });
    }
}