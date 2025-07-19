// src/app/api/voice-recordings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { VoiceRecordingStatus } from '@prisma/client';
import { writeFile } from 'fs/promises'; // Dosya yazmak için
import { mkdir } from 'fs/promises'; // Klasör oluşturmak için
import path from 'path'; // Dosya yollarını birleştirmek için

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
    }
    const userId = parseInt(session.user.id);

    try {
        const formData = await request.formData();
        const audioBlob = formData.get('audioBlob') as File | null;
        const lineIdStr = formData.get('lineId') as string | null;

        if (!audioBlob || !lineIdStr) {
            return NextResponse.json({ message: 'Eksik veri' }, { status: 400 });
        }
        
        const lineId = parseInt(lineIdStr);

        // 1. Dosyayı Buffer'a çevir
        const buffer = Buffer.from(await audioBlob.arrayBuffer());
        
        // 2. Benzersiz bir dosya adı oluştur (çakışmaları önlemek için)
        const filename = `raw_line_${lineId}_${Date.now()}.webm`;

        // 3. Kaydedilecek yolu belirle
        const directoryPath = path.join(process.cwd(), 'public', 'uploads', 'recordings');
        const filePath = path.join(directoryPath, filename);
        
        // 4. Klasörün var olduğundan emin ol (yoksa oluştur)
        await mkdir(directoryPath, { recursive: true });

        // 5. Dosyayı diske yaz
        await writeFile(filePath, buffer);

        // 6. Veritabanına kaydedilecek halka açık URL'i oluştur
        const publicUrl = `/uploads/recordings/${filename}`;
        
        // 7. Prisma "upsert" ile veritabanını güncelle
        const newRawRecording = await prisma.rawVoiceRecording.upsert({
            where: { lineId: lineId },
            update: {
                url: publicUrl,
                uploadedById: userId,
                createdAt: new Date(),
            },
            create: {
                lineId: lineId,
                url: publicUrl,
                uploadedById: userId,
            }
        });

        const updatedLine = await prisma.translationLine.update({
        where: { id: lineId },
        data: { recordingStatus: VoiceRecordingStatus.PENDING_MIX }
    });

        return NextResponse.json({
        message: "Ham kayıt başarıyla yüklendi, miksaj bekleniyor.",
        recordingStatus: updatedLine.recordingStatus,
        rawRecordingUrl: newRawRecording.url // YENİ: URL'i ekledik
    });

    } catch (error: any) {
        console.error("[VOICE_RECORDING_POST_ERROR]", error);
        return NextResponse.json({ message: 'Sunucu Hatası', error: error.message }, { status: 500 });
    }
}