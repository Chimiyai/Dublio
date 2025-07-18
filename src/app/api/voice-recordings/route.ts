// src/app/api/voice-recordings/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary yapılandırması
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Yetkisiz' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const audioBlob = formData.get('audioBlob') as File | null;
        const lineIdStr = formData.get('lineId') as string | null;

        if (!audioBlob || !lineIdStr) {
            return NextResponse.json({ message: 'Eksik veri: audioBlob veya lineId' }, { status: 400 });
        }
        
        const lineId = parseInt(lineIdStr);

        // Buffer'a çevir
        const audioBuffer = await audioBlob.arrayBuffer();
        const buffer = Buffer.from(audioBuffer);

        // Cloudinary'e yükle
        const uploadResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                resource_type: 'video', // audio 'video' tipi altında saklanır
                folder: 'voice_recordings' // Cloudinary'de bir klasörde sakla
            }, (error, result) => {
                if (error) reject(error);
                resolve(result);
            }).end(buffer);
        });

        const result = uploadResponse as { secure_url: string };
        if (!result || !result.secure_url) {
            throw new Error('Cloudinary yüklemesi başarısız oldu.');
        }

        // Veritabanındaki TranslationLine'ı güncelle
        await prisma.translationLine.update({
            where: { id: lineId },
            data: { voiceRecordingUrl: result.secure_url }
        });

        return NextResponse.json({ url: result.secure_url });

    } catch (error: any) {
        console.error("[VOICE_RECORDING_POST_ERROR]", error);
        return NextResponse.json({ message: 'Sunucu Hatası', error: error.message }, { status: 500 });
    }
}