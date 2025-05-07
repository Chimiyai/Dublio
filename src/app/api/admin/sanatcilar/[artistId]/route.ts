import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Sanatçı güncelleme için beklenen request body'sinin şeması
// Tüm alanlar opsiyonel olmalı, çünkü sadece bazılarını güncellemek isteyebiliriz.
const updateArtistSchema = z.object({
  firstName: z.string().min(1, { message: "Sanatçı adı boş bırakılamaz." }).max(191).optional(),
  lastName: z.string().min(1, { message: "Sanatçı soyadı boş bırakılamaz." }).max(191).optional(),
  bio: z.string().optional(),
  imageUrl: z.string().url({ message: "Geçerli bir resim URL'si giriniz." }).nullable().optional(), // null veya undefined olabilir
});

export async function PATCH(
  request: Request,
  { params }: { params: { artistId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const artistIdAsInt = parseInt(params.artistId, 10);
  if (isNaN(artistIdAsInt)) {
    return NextResponse.json({ message: 'Geçersiz sanatçı ID formatı.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedBody = updateArtistSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { firstName, lastName, bio, imageUrl } = parsedBody.data;

    // Güncellenecek veriyi oluştur, sadece tanımlı olanları ekle
    const dataToUpdate: {
      firstName?: string;
      lastName?: string;
      bio?: string | null;
      imageUrl?: string | null;
    } = {};

    if (firstName !== undefined) dataToUpdate.firstName = firstName;
    if (lastName !== undefined) dataToUpdate.lastName = lastName;
    if (bio !== undefined) dataToUpdate.bio = bio || null; // Boş string gelirse null yap
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl; // Zod zaten null veya URL olarak doğruladı

    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ message: 'Güncellenecek bir veri sağlanmadı.' }, { status: 400 });
    }

    const updatedArtist = await prisma.dubbingArtist.update({
      where: { id: artistIdAsInt },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedArtist, { status: 200 });
  } catch (error: any) {
    console.error('Sanatçı güncelleme hatası:', error);
    if (error.code === 'P2025') { // Prisma'nın "kayıt bulunamadı" hatası
      return NextResponse.json({ message: 'Güncellenecek sanatçı bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Sanatçı güncellenirken sunucuda bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// GET metodu (tek bir sanatçıyı ID ile çekmek için) buraya eklenebilir
// Ancak düzenleme sayfasında Server Component ile doğrudan Prisma'dan çekmeyi tercih edeceğiz.
// export async function GET(
//   request: Request,
//   { params }: { params: { artistId: string } }
// ) {
//   // ... (admin kontrolü vs.)
//   const artistIdAsInt = parseInt(params.artistId, 10);
//   // ... (ID kontrolü)
//   const artist = await prisma.dubbingArtist.findUnique({ where: { id: artistIdAsInt } });
//   if (!artist) return NextResponse.json({ message: 'Sanatçı bulunamadı' }, { status: 404 });
//   return NextResponse.json(artist);
// }
export async function DELETE(
    request: Request,
    { params }: { params: { artistId: string } }
  ) {
    const session = await getServerSession(authOptions);
  
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
    }
  
    const artistIdAsInt = parseInt(params.artistId, 10);
    if (isNaN(artistIdAsInt)) {
      return NextResponse.json({ message: 'Geçersiz sanatçı ID formatı.' }, { status: 400 });
    }
  
    try {
      // Sanatçıyı bul (opsiyonel, silme öncesi varlığını kontrol etmek için)
      const artistToDelete = await prisma.dubbingArtist.findUnique({
        where: { id: artistIdAsInt },
      });
  
      if (!artistToDelete) {
        return NextResponse.json({ message: 'Silinecek sanatçı bulunamadı.' }, { status: 404 });
      }
  
      // Sanatçıyı sil
      // ÖNEMLİ NOT: Eğer DubbingArtist'a bağlı ProjectAssignment kayıtları varsa
      // ve ProjectAssignment şemasında artistId için onDelete: Cascade tanımlı DEĞİLSE,
      // bu silme işlemi hata verebilir (foreign key constraint).
      // Proje özetinde ProjectAssignment için şöyle demiştin:
      // artist (onDelete: Cascade)
      // Bu Cascade tanımı varsa, sanatçı silindiğinde ilgili atamalar da silinir.
      // Eğer bu tanım yoksa veya farklı bir davranış isteniyorsa (örn: atamaları null yapmak),
      // önce ilgili atamaları manuel olarak silmek/güncellemek gerekebilir.
      // Şu anki şemaya göre Cascade olduğu için sorun olmamalı.
  
      await prisma.dubbingArtist.delete({
        where: { id: artistIdAsInt },
      });
  
      return NextResponse.json(
        { message: `'${artistToDelete.firstName} ${artistToDelete.lastName}' adlı sanatçı başarıyla silindi.` },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Sanatçı silme hatası:', error);
      // Prisma'nın P2003 (foreign key constraint) hatası, onDelete: Cascade düzgün çalışmazsa ortaya çıkabilir.
      if (error.code === 'P2003') {
          return NextResponse.json(
              { message: 'Bu sanatçı projelere atanmış olduğu için direkt silinemez. Önce projelerden kaldırın.' },
              { status: 409 } // Conflict
          );
      }
      if (error.code === 'P2025') { // Kayıt bulunamadı (findUnique sonrası silinmiş olabilir)
        return NextResponse.json({ message: 'Silinecek sanatçı bulunamadı.' }, { status: 404 });
      }
      return NextResponse.json(
        { message: 'Sanatçı silinirken sunucuda bir hata oluştu.' },
        { status: 500 }
      );
    }
  }
  