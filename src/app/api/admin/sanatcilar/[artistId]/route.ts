// src/app/api/admin/sanatcilar/[artistId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const updateArtistSchema = z.object({
  firstName: z.string().min(1, "Ad boş bırakılamaz.").max(191).optional(),
  lastName: z.string().min(1, "Soyad boş bırakılamaz.").max(191).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug geçersiz formatta.").max(191).nullable().optional(),
  bio: z.string().max(5000, "Biyografi çok uzun.").nullable().optional(), // max(2000)'den max(5000)'e yükseltildi
  imagePublicId: z.string().max(255).nullable().optional(),
  siteRole: z.string().max(100).nullable().optional(),
  websiteUrl: z.string().url({ message: "Geçersiz web sitesi URL'i." }).or(z.literal('')).nullable().optional().transform(val => val === '' ? null : val),
  twitterUrl: z.string().url({ message: "Geçersiz Twitter URL'i." }).or(z.literal('')).nullable().optional().transform(val => val === '' ? null : val),
  instagramUrl: z.string().url({ message: "Geçersiz Instagram URL'i." }).or(z.literal('')).nullable().optional().transform(val => val === '' ? null : val),
  youtubeUrl: z.string().url({ message: "Geçersiz YouTube URL'i." }).or(z.literal('')).nullable().optional().transform(val => val === '' ? null : val),
  linkedinUrl: z.string().url({ message: "Geçersiz LinkedIn URL'i." }).or(z.literal('')).nullable().optional().transform(val => val === '' ? null : val),
  githubUrl: z.string().url({ message: "Geçersiz GitHub URL'i." }).or(z.literal('')).nullable().optional().transform(val => val === '' ? null : val),
  donationLink: z.string().url({ message: "Geçersiz bağış URL'i." }).or(z.literal('')).nullable().optional().transform(val => val === '' ? null : val),
  isTeamMember: z.boolean().optional(),
  teamOrder: z.number().int("Sıralama tam sayı olmalı.").nullable().optional(),
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

export async function PUT( // YENİ: PUT olarak değiştirildi
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
    // Gelen body'yi loglayalım (debug için)
    console.log("API Sanatçı Güncelleme - Gelen Body:", body);
    const parsedBody = updateArtistSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error("API Sanatçı Güncelleme - Zod Hataları:", parsedBody.error.flatten().fieldErrors);
      return NextResponse.json(
        { message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const dataToUpdateFromClient = parsedBody.data;

    const currentArtist = await prisma.dubbingArtist.findUnique({
      where: { id: artistIdAsInt },
      // Gerekli tüm alanları seçelim ki karşılaştırma yapabilelim
      select: { 
        imagePublicId: true, 
        firstName: true, 
        lastName: true, 
        slug: true,
        bio: true, 
        siteRole: true,
        websiteUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        linkedinUrl: true,
        githubUrl: true,
        donationLink: true,
        isTeamMember: true,
        teamOrder: true,
      }
    });

    if (!currentArtist) {
      return NextResponse.json({ message: 'Güncellenecek sanatçı bulunamadı.' }, { status: 404 });
    }

    // Sadece gerçekten değişen alanları içeren bir dataToUpdate objesi oluşturalım
    const dataToActuallyUpdate: Prisma.DubbingArtistUpdateInput = {};
    let hasChanges = false;

    for (const key in dataToUpdateFromClient) {
        const K = key as keyof typeof dataToUpdateFromClient;
        // currentArtist'ta bu alanın olup olmadığını da kontrol et (yeni eklenen alanlar için)
        // ve null/undefined durumlarını doğru karşılaştır
        const clientValue = dataToUpdateFromClient[K];
        const dbValue = currentArtist[K as keyof typeof currentArtist];

        // null ve undefined'ı aynı kabul etmek için basit bir kontrol
        // veya daha iyisi, Object.prototype.hasOwnProperty.call(dataToUpdateFromClient, K) ile kontrol et
        if (Object.prototype.hasOwnProperty.call(dataToUpdateFromClient, K)) {
            if (clientValue !== dbValue && !(clientValue === null && dbValue === undefined) && !(clientValue === undefined && dbValue === null) ) {
                 (dataToActuallyUpdate as any)[K] = clientValue;
                 hasChanges = true;
            }
        }
    }

    // Slug unique kontrolü
    if (dataToActuallyUpdate.slug && dataToActuallyUpdate.slug !== currentArtist.slug) {
        const existingSlugArtist = await prisma.dubbingArtist.findFirst({ where: { slug: dataToActuallyUpdate.slug as string, NOT: { id: artistIdAsInt } }});
        if (existingSlugArtist) {
            return NextResponse.json({ errors: { slug: ['Bu slug zaten başka bir sanatçı tarafından kullanılıyor.']}}, { status: 409 });
        }
    }
    
    // Resim değişikliği ve arşivleme
    if (dataToUpdateFromClient.imagePublicId !== undefined && dataToUpdateFromClient.imagePublicId !== currentArtist.imagePublicId) {
        if (currentArtist.imagePublicId) { // Sadece eski resim varsa arşivle
            const archivePublicId = getArchivePublicIdForArtist(currentArtist.imagePublicId);
            if (archivePublicId) {
                cloudinary.uploader.rename(currentArtist.imagePublicId, archivePublicId, { resource_type: 'image', overwrite: true })
                    .then(result => console.log('Eski sanatçı resmi arşivlendi:', result.public_id))
                    .catch(err => console.error("Cloudinary eski sanatçı resmi arşivleme hatası (PUT):", err.message));
            }
        }
        // dataToActuallyUpdate.imagePublicId zaten set edilmiş olmalı (eğer değiştiyse)
    }


    if (!hasChanges) {
      return NextResponse.json(currentArtist); 
    }

    const updatedArtist = await prisma.dubbingArtist.update({
      where: { id: artistIdAsInt },
      data: dataToActuallyUpdate, // Sadece değişen alanları gönder
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