// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Yolunu kontrol et
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Prisma tipleri için
import { v2 as cloudinary } from 'cloudinary'; // Cloudinary SDK

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper: Eski publicId'den arşiv publicId'si oluştur (utils'e taşınabilir)
const getArchivePublicIdForUser = (oldPublicId: string, imageType: 'profile' | 'banner') => {
    if (!oldPublicId) return null;
    const baseArchiveFolder = 'kullanilmayanlar';
    // user_profiles/123/eski_id gibi bir yapıdan sadece eski_id kısmını alıp arşivleyelim
    // veya direkt tüm ID'yi alıp timestamp ekleyelim.
    // Şimdilik, direkt ID'yi alıp 'user_profile_arsiv' veya 'user_banner_arsiv' altına taşıyalım.
    const subFolder = imageType === 'profile' ? 'user_profile_arsiv' : 'user_banner_arsiv';
    
    let filenamePart = oldPublicId;
    // Eğer oldPublicId "user_profiles/userId/filename" formatında ise, sadece "filename" kısmını al
    if (oldPublicId.includes('/')) {
        filenamePart = oldPublicId.substring(oldPublicId.lastIndexOf('/') + 1);
    }
    
    return `${baseArchiveFolder}/${subFolder}/${filenamePart}_${Date.now()}`.substring(0, 200);
};


// Profil güncelleme için Zod şeması (artık birden fazla alanı destekliyor)
const updateProfileSchema = z.object({
  username: z.string()
    .min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." })
    .max(30, { message: "Kullanıcı adı en fazla 30 karakter olabilir." })
    .regex(/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+$/, { message: "Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir." }) // Türkçe karakterlere izin ver
    .optional(),
  profileImagePublicId: z.string().nullable().optional(),
  bannerImagePublicId: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim. Lütfen giriş yapın.' }, { status: 401 });
  }

  const userIdAsNumber = parseInt(session.user.id, 10);
  if (isNaN(userIdAsNumber)) {
     return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedBody = updateProfileSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username: newUsername, profileImagePublicId: newProfilePublicId, bannerImagePublicId: newBannerPublicId } = parsedBody.data;
    
    const dataToUpdate: Prisma.UserUpdateInput = {};
    let hasChanges = false;

    // Mevcut kullanıcıyı çek (eski public ID'leri ve username'i almak için)
    const currentUser = await prisma.user.findUnique({
        where: { id: userIdAsNumber },
        select: { username: true, profileImagePublicId: true, bannerImagePublicId: true }
    });

    if (!currentUser) {
        return NextResponse.json({ message: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    // Kullanıcı adı değişikliği kontrolü
    if (newUsername !== undefined && newUsername !== currentUser.username) {
      const existingUserWithNewName = await prisma.user.findUnique({ where: { username: newUsername } });
      if (existingUserWithNewName && existingUserWithNewName.id !== userIdAsNumber) {
        return NextResponse.json(
            { message: 'Bu kullanıcı adı zaten kullanımda.', errors: { username: ['Bu kullanıcı adı zaten alınmış.'] }}, 
            { status: 409 }
        );
      }
      dataToUpdate.username = newUsername;
      hasChanges = true;
    }

    // Profil resmi değişikliği kontrolü ve eski resmi arşivleme
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'profileImagePublicId')) {
        if (newProfilePublicId !== currentUser.profileImagePublicId) {
            dataToUpdate.profileImagePublicId = newProfilePublicId; // Bu null da olabilir
            hasChanges = true;
            if (currentUser.profileImagePublicId) {
                const archiveId = getArchivePublicIdForUser(currentUser.profileImagePublicId, 'profile');
                if (archiveId) {
                    try {
                        await cloudinary.uploader.rename(currentUser.profileImagePublicId, archiveId, { resource_type: 'image', overwrite: false });
                        console.log(`Eski profil resmi arşivlendi: ${currentUser.profileImagePublicId} -> ${archiveId}`);
                    } catch (e: any) { 
                        if (!(e.http_code === 404 && e.message?.includes("Resource not found"))) {
                            console.error("Cloudinary eski profil resmi arşivleme hatası:", e);
                        } else {
                            console.log("Arşivlenecek eski profil resmi Cloudinary'de bulunamadı.");
                        }
                    }
                }
            }
        }
    }

    // Banner resmi değişikliği kontrolü ve eski resmi arşivleme
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'bannerImagePublicId')) {
        if (newBannerPublicId !== currentUser.bannerImagePublicId) {
            dataToUpdate.bannerImagePublicId = newBannerPublicId; // Bu null da olabilir
            hasChanges = true;
            if (currentUser.bannerImagePublicId) {
                const archiveId = getArchivePublicIdForUser(currentUser.bannerImagePublicId, 'banner');
                if (archiveId) {
                    try {
                        await cloudinary.uploader.rename(currentUser.bannerImagePublicId, archiveId, { resource_type: 'image', overwrite: false });
                        console.log(`Eski banner resmi arşivlendi: ${currentUser.bannerImagePublicId} -> ${archiveId}`);
                    } catch (e: any) { 
                        if (!(e.http_code === 404 && e.message?.includes("Resource not found"))) {
                            console.error("Cloudinary eski banner resmi arşivleme hatası:", e);
                        } else {
                            console.log("Arşivlenecek eski banner resmi Cloudinary'de bulunamadı.");
                        }
                    }
                }
            }
        }
    }

    if (!hasChanges) {
      return NextResponse.json({ message: 'Değişiklik yapılmadı.', user: currentUser });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdAsNumber },
      data: dataToUpdate,
      select: { // Client'a sadece gerekli ve güncel bilgileri döndür
        id: true,
        username: true,
        email: true, // Email değişmiyor ama session'da olabilir
        role: true,  // Rol değişmiyor ama session'da olabilir
        profileImagePublicId: true,
        bannerImagePublicId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ 
        message: 'Profil başarıyla güncellendi.', 
        user: updatedUser 
    });

  } catch (error: any) {
    console.error('Profil güncelleme API hatası:', error);
     if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Güncellenecek kullanıcı bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Profil güncellenirken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}