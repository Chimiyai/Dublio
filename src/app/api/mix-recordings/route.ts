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
        // DÜZELTME: Gelen veriyi File yerine Blob olarak ele almak daha güvenlidir.
        const finalMixBlob = formData.get('finalMixBlob') as Blob | null;
        const lineIdStr = formData.get('lineId') as string | null;

        if (!finalMixBlob || !lineIdStr) {
            return NextResponse.json({ message: 'Eksik veri' }, { status: 400 });
        }
        
        // YENİ: Dosyanın boş gelmediğinden emin olmak için bir güvenlik kontrolü
        if (finalMixBlob.size === 0) {
            return NextResponse.json({ message: 'Yüklenen dosya boş.' }, { status: 400 });
        }
        
        const lineId = parseInt(lineIdStr);

        // DÜZELTME: Veriyi buffer'a dönüştürmenin en sağlam yolu
        const buffer = Buffer.from(await finalMixBlob.arrayBuffer());

        // Dosya uzantısını orijinal addan alıyoruz
        const fileExtension = (finalMixBlob as File).name.split('.').pop() || 'mp3';
        const filename = `final_mix_line_${lineId}_${Date.now()}.${fileExtension}`;

        const directoryPath = path.join(process.cwd(), 'public', 'uploads', 'recordings');
        const filePath = path.join(directoryPath, filename);
        
        await mkdir(directoryPath, { recursive: true });
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/recordings/${filename}`;

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
