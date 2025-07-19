//src/app/api/mix-recordings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { VoiceRecordingStatus } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const finalMixBlob = formData.get('finalMixBlob') as File | null;
        const lineIdStr = formData.get('lineId') as string | null;

        if (!finalMixBlob || !lineIdStr) {
            return NextResponse.json({ message: 'Eksik veri' }, { status: 400 });
        }
        
        const lineId = parseInt(lineIdStr);

        // 1. Dosyayı Buffer'a çevir
        const buffer = Buffer.from(await finalMixBlob.arrayBuffer());

        // 2. Benzersiz bir dosya adı oluştur
        const filename = `final_mix_line_${lineId}_${Date.now()}.${finalMixBlob.name.split('.').pop()}`;

        // 3. Kaydedilecek yolu belirle
        const directoryPath = path.join(process.cwd(), 'public', 'uploads', 'recordings');
        const filePath = path.join(directoryPath, filename);
        
        // 4. Klasörün var olduğundan emin ol
        await mkdir(directoryPath, { recursive: true });

        // 5. Dosyayı diske yaz
        await writeFile(filePath, buffer);

        // 6. Veritabanına kaydedilecek halka açık URL'i oluştur
        const publicUrl = `/uploads/recordings/${filename}`;

        // 7. TranslationLine'ı doğrudan güncelle
        const updatedLine = await prisma.translationLine.update({
            where: { id: lineId },
            data: {
                voiceRecordingUrl: publicUrl,
                recordingStatus: VoiceRecordingStatus.COMPLETED,
            },
            select: {
                id: true,
                voiceRecordingUrl: true,
                recordingStatus: true,
            }
        });

        return NextResponse.json(updatedLine);

    } catch (error: any) {
        console.error("[MIX_RECORDING_POST_ERROR]", error);
        return NextResponse.json({ message: 'Sunucu Hatası', error: error.message }, { status: 500 });
    }
}
