// src/app/api/admin/sanatcilar/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server'; // NextRequest importu
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const createArtistSchema = z.object({
  firstName: z.string().min(1, { message: "Sanatçı adı boş bırakılamaz." }).max(191),
  lastName: z.string().min(1, { message: "Sanatçı soyadı boş bırakılamaz." }).max(191),
  bio: z.string().max(2000, "Biyografi çok uzun").nullable().optional(), // max uzunluk eklendi
  imagePublicId: z.string().nullable().optional(), // imageUrl yerine imagePublicId
});

export async function POST(request: NextRequest) { // Request tipi NextRequest oldu
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsedBody = createArtistSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { firstName, lastName, bio, imagePublicId } = parsedBody.data;

    const newArtist = await prisma.dubbingArtist.create({
      data: {
        firstName,
        lastName,
        bio: bio, // Zod zaten nullable yaptı
        imagePublicId: imagePublicId, // imageUrl yerine
      },
    });

    return NextResponse.json(newArtist, { status: 201 });
  } catch (error) {
    console.error('Sanatçı ekleme API hatası:', error);
    return NextResponse.json(
      { message: 'Sanatçı eklenirken sunucuda bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// GET metodu (eğer varsa) aynı kalabilir, sadece select kısmında imagePublicId seçilmeli
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
    }
    try {
        const artists = await prisma.dubbingArtist.findMany({
            orderBy: { createdAt: 'desc' },
            // Eğer tüm alanlar gerekiyorsa select'e gerek yok.
            // Sadece belirli alanlar gerekiyorsa:
            // select: { id: true, firstName: true, lastName: true, imagePublicId: true, createdAt: true } 
        });
        return NextResponse.json(artists);
    } catch (error) {
        console.error("Sanatçılar getirilirken hata:", error);
        return NextResponse.json({ message: "Sanatçılar getirilirken bir hata oluştu." }, { status: 500 });
    }
}