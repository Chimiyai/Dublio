//src/app/api/translation-lines/[lineId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { TranslationStatus } from '@prisma/client';

const updateLineSchema = z.object({
  translatedText: z.string(), // Boş da olabilir, çeviriyi silmek için
});

export async function PUT(
  request: Request,
  { params }: { params: { lineId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const lineId = parseInt(params.lineId, 10);
    if (!session?.user?.id || isNaN(lineId)) {
      return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
    }
    // TODO: Burada, bu işlemi yapan kullanıcının o projede gerçekten
    // "Çevirmen" rolüne sahip olup olmadığını kontrol eden bir yetki mekanizması olmalı.
    // Şimdilik sadece giriş yapmış olmasını yeterli görüyoruz.

    const body = await request.json();
    const validation = updateLineSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse('Geçersiz veri', { status: 400 });
    }
    const { translatedText } = validation.data;

    const updatedLine = await prisma.translationLine.update({
      where: { id: lineId },
      data: {
        translatedText: translatedText,
        // Çeviri yapıldığında statüyü otomatik olarak 'TRANSLATED' yap.
        // Eğer boş gönderilirse, 'NOT_TRANSLATED' yap.
        status: translatedText.trim() === '' ? TranslationStatus.NOT_TRANSLATED : TranslationStatus.TRANSLATED,
      }
    });

    return NextResponse.json(updatedLine);

  } catch (error) {
    console.error("[UPDATE_LINE_ERROR]", error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}