//src/app/api/voice-recordings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz', { status: 401 });
    }

    // Gelen veri FormData formatında olacak.
    const data = await request.formData();
    const file: File | null = data.get('audioBlob') as unknown as File;
    const lineIdStr: string | null = data.get('lineId') as string;

    if (!file || !lineIdStr) {
      return new NextResponse('Eksik bilgi', { status: 400 });
    }
    const lineId = parseInt(lineIdStr, 10);

    // TODO: Yetki kontrolü - Bu kullanıcı bu repliği seslendirme görevine sahip mi?

    // Dosyayı lokal diske kaydet
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), 'public/uploads/recordings');
    // Tarayıcılar genellikle webm veya ogg formatında gönderir, dosya uzantısını buna göre ayarlayalım.
    const filename = `rec_${lineId}_${Date.now()}.webm`;
    const filepath = path.join(uploadsDir, filename);

    // public/uploads/recordings klasörünün var olduğundan emin ol
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(filepath, buffer);
    const publicPath = `/uploads/recordings/${filename}`;

    // Veritabanındaki ilgili TranslationLine'ı güncelle
    const updatedLine = await prisma.translationLine.update({
      where: { id: lineId },
      data: {
        voiceRecordingUrl: publicPath,
      },
    });

    return NextResponse.json({ success: true, url: publicPath, updatedLine });

  } catch (error) {
    console.error("[VOICE_RECORDING_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}