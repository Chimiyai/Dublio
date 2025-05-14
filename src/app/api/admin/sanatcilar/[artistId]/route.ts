// src/app/api/admin/sanatcilar/[artistId]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const updateArtistSchema = z.object({
  firstName: z.string().min(1, "Ad boş bırakılamaz.").max(191).optional(),
  lastName: z.string().min(1, "Soyad boş bırakılamaz.").max(191).optional(),
  bio: z.string().max(2000, "Biyografi çok uzun.").nullable().optional(),
  imagePublicId: z.string().max(255, "Resim ID'si çok uzun.").nullable().optional(), // Uzunluk kontrolü eklendi
});

// Helper fonksiyon: Eski publicId'den arşiv publicId'si oluştur
// Bu fonksiyonu API dosyasının dışında bir utils dosyasına taşımak daha iyi olabilir
const getArchivePublicIdForArtist = (oldPublicId: string) => {
    if (!oldPublicId) return null;
    const baseArchiveFolder = 'kullanilmayanlar';
    const subFolder = 'sanatcilar_arsiv'; // Sanatçılar için özel arşiv klasörü
    
    let filenameWithTimestamp = oldPublicId;
    // Eğer oldPublicId zaten "artist_profiles/" gibi bir klasör içeriyorsa, sadece dosya adını alalım
    if (oldPublicId.includes('/')) {
        filenameWithTimestamp = oldPublicId.substring(oldPublicId.lastIndexOf('/') + 1);
    }
    // Yeni publicId: kullanilmayanlar/sanatcilar_arsiv/orijinalDosyaAdi_timestamp
    return `${baseArchiveFolder}/${subFolder}/${filenameWithTimestamp}_${Date.now()}`.substring(0, 200);
};

export async function PATCH(
  request: NextRequest,
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

    const { firstName, lastName, bio, imagePublicId: newImagePublicId } = parsedBody.data;

    // Güncellenecek verileri tutacak obje
    const dataToUpdate: {
        firstName?: string;
        lastName?: string;
        bio?: string | null;
        imagePublicId?: string | null;
    } = {};
    let hasChanges = false;

    // Mevcut sanatçıyı bulup eski public ID'yi ve diğer alanları al
    const currentArtist = await prisma.dubbingArtist.findUnique({
      where: { id: artistIdAsInt },
      select: { imagePublicId: true, firstName: true, lastName: true, bio: true }
    });

    if (!currentArtist) {
      return NextResponse.json({ message: 'Güncellenecek sanatçı bulunamadı.' }, { status: 404 });
    }

    // Alanları karşılaştır ve sadece değişmişse güncellemeye ekle
    if (firstName !== undefined && firstName !== currentArtist.firstName) { 
        dataToUpdate.firstName = firstName; hasChanges = true; 
    }
    if (lastName !== undefined && lastName !== currentArtist.lastName) { 
        dataToUpdate.lastName = lastName; hasChanges = true; 
    }
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'bio')) {
        if (bio !== (currentArtist.bio || null)) { 
            dataToUpdate.bio = bio; hasChanges = true;
        }
    }
  
    const oldImagePublicId = currentArtist.imagePublicId; // Bu, DB'den gelen sanatçının ESKİ public ID'si

    // newImagePublicId, client'tan gelen ve formda o an set edilmiş olan YENİ (veya kaldırılmışsa null) public ID
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'imagePublicId')) { // 1. Client imagePublicId'yi gönderdi mi?
        if (newImagePublicId !== oldImagePublicId) { // 2. Yeni ID, eski ID'den farklı mı?
            dataToUpdate.imagePublicId = newImagePublicId; 
            hasChanges = true;

            if (oldImagePublicId) { // 3. Eski bir public ID VAR MIYDI?
                const archivePublicId = getArchivePublicIdForArtist(oldImagePublicId); // Arşiv ID'si oluştur
                if (archivePublicId) {
                    try {
                        console.log(`Cloudinary'de arşivleniyor (sanatçı PATCH): ${oldImagePublicId} -> ${archivePublicId}`);
                        const renameResult = await cloudinary.uploader.rename(oldImagePublicId, archivePublicId, { resource_type: 'image', overwrite: false });
                        console.log('Arşivleme sonucu (PATCH):', renameResult.public_id ? 'Başarılı' : 'Başarısız veya zaten yok', renameResult);
                    } catch (renameError: any) {
                        if (renameError.http_code === 404 && renameError.message?.includes("Resource not found")) {
                            console.log(`Arşivlenecek eski sanatçı resmi (${oldImagePublicId}) Cloudinary'de bulunamadı (PATCH).`);
                        } else {
                            console.error("Cloudinary eski sanatçı resmi arşivleme hatası (PATCH):", JSON.stringify(renameError, null, 2));
                        }
                    }
                }
            }
        }
    }

    if (!hasChanges) {
      // Eğer hiçbir alan (isim, soyisim, bio, resim) değişmediyse, mevcut veriyi döndür.
      // Client tarafında EditArtistForm'da zaten "Değişiklik yapılmadı" toast'ı gösteriliyor.
      return NextResponse.json(currentArtist); 
    }

    const updatedArtist = await prisma.dubbingArtist.update({
      where: { id: artistIdAsInt },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedArtist);
  } catch (error: any) {
    console.error('Sanatçı güncelleme API hatası:', error);
    if (error.code === 'P2025') { 
      return NextResponse.json({ message: 'Güncellenecek sanatçı bulunamadı (muhtemelen silinmiş).' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Sanatçı güncellenirken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}

// DELETE fonksiyonu (eğer varsa, benzer şekilde resmi arşivlemeli)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { artistId: string } }
  ) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
    }
    const artistIdAsInt = parseInt(params.artistId, 10);
    if (isNaN(artistIdAsInt)) {
        return NextResponse.json({ message: 'Geçersiz sanatçı ID.' }, { status: 400 });
    }
  
    try {
      const artistToDelete = await prisma.dubbingArtist.findUnique({
        where: { id: artistIdAsInt },
        select: { imagePublicId: true, firstName: true, lastName: true }
      });
  
      if (!artistToDelete) {
        return NextResponse.json({ message: 'Silinecek sanatçı bulunamadı.' }, { status: 404 });
      }
  
      // Önce DB'den sil (veya önce arşivle, sonra sil)
      await prisma.dubbingArtist.delete({ where: { id: artistIdAsInt } });
  
      if (artistToDelete.imagePublicId) {
        const archivePublicId = getArchivePublicIdForArtist(artistToDelete.imagePublicId); // Arşiv klasörü default
        if (archivePublicId) {
            try {
                console.log(`Cloudinary'de arşivleniyor (sanatçı DELETE): ${artistToDelete.imagePublicId} -> ${archivePublicId}`);
                await cloudinary.uploader.rename(artistToDelete.imagePublicId, archivePublicId, { resource_type: 'image', overwrite: false });
            } catch (renameError: any) {
                if (renameError.http_code === 404 && renameError.message?.includes("Resource not found")) {
                    console.log(`Arşivlenecek resim Cloudinary'de bulunamadı (DELETE): ${artistToDelete.imagePublicId}`);
                } else {
                    console.error("Cloudinary sanatçı resmi arşivleme hatası (DELETE):", renameError);
                }
            }
        }
      }
      return NextResponse.json({ message: `'${artistToDelete.firstName} ${artistToDelete.lastName}' başarıyla silindi.` });
    } catch (error: any) {
      console.error('Sanatçı silme hatası:', error);
    if (error.code === 'P2003') { // Foreign key constraint
        return NextResponse.json(
            { message: 'Bu sanatçı projelere atanmış olduğu için direkt silinemez. Önce projelerden kaldırın.' },
            { status: 409 }
        );
    }
    if (error.code === 'P2025') { // Kayıt bulunamadı
      return NextResponse.json({ message: 'Silinecek sanatçı bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Sanatçı silinirken sunucuda bir hata oluştu.' },
      { status: 500 }
    );
  }
}