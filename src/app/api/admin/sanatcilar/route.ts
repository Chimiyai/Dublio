import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Güncellenmiş sanatçı ekleme şeması
const createArtistSchema = z.object({
  firstName: z.string().min(1, { message: "Sanatçı adı boş bırakılamaz." }).max(191),
  lastName: z.string().min(1, { message: "Sanatçı soyadı boş bırakılamaz." }).max(191),
  bio: z.string().optional(),
  imageUrl: z.string().url({ message: "Geçerli bir resim URL'si giriniz." }).optional().or(z.literal('')),
});

export async function POST(request: Request) {
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

    const { firstName, lastName, bio, imageUrl } = parsedBody.data;

    // Benzersizlik kontrolü (firstName ve lastName kombinasyonu için gerekirse)
    // Bu biraz daha karmaşık olabilir, şimdilik atlıyoruz.
    // İstersen sadece "bu isim ve soyisimde biri var" diye bir kontrol de eklenebilir.

    const newArtist = await prisma.dubbingArtist.create({
      data: {
        firstName,
        lastName,
        bio: bio || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(newArtist, { status: 201 });
  } catch (error) {
    console.error('Sanatçı ekleme hatası:', error);
    // ... (hata yönetimi aynı kalabilir) ...
    return NextResponse.json(
      { message: 'Sanatçı eklenirken sunucuda bir hata oluştu.' },
      { status: 500 }
    );
  }
}
