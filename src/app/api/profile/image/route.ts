// src/app/api/profile/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
// Node.js'in stream modülüne artık gerek yok

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper fonksiyon: Web Stream'ini buffer'a çevirmek için (Yeni Versiyon)
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            chunks.push(value);
        }
    }
    return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) {
     return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('profileImage') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'Dosya yüklenmedi.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
         return NextResponse.json({ message: 'Sadece resim dosyaları yüklenebilir.' }, { status: 400 });
    }

     const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
     if (file.size > maxSizeInBytes) {
       return NextResponse.json({ message: `Dosya boyutu çok büyük. Maksimum ${maxSizeInBytes / (1024 * 1024)}MB olabilir.` }, { status: 400 });
     }

    // Dosyayı buffer'a çevir (Yeni streamToBuffer kullanımı)
    const fileBuffer = await streamToBuffer(file.stream());

    // Cloudinary'ye yükle (Promise tipi düzeltildi)
    const uploadResult = await new Promise<{ secure_url?: string; public_id?: string; [key: string]: any } | undefined>((resolve, reject) => {
       cloudinary.uploader.upload_stream(
        {
          folder: 'prestij_dublaj/avatars', 
          public_id: `user_${userId}_avatar`, 
          overwrite: true,
          format: 'webp', 
          // transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }] 
        },
        (error, result) => { 
          if (error) {
             console.error("Cloudinary upload stream error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(fileBuffer);
    });
    

    if (!uploadResult?.secure_url) {
         console.error("Cloudinary yükleme sonucu hatalı veya secure_url yok:", uploadResult);
         throw new Error('Dosya Cloudinary\'ye yüklenemedi veya URL alınamadı.');
    }

    const imageUrl = uploadResult.secure_url;

    // Veritabanındaki kullanıcı profil resmini güncelle
    await prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: imageUrl },
    });

    return NextResponse.json({ 
        message: 'Profil fotoğrafı başarıyla güncellendi.', 
        imageUrl: imageUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Profil fotoğrafı yükleme API hatası:', error);
     if (error.message?.includes('Cloudinary') || error.http_code) { // Cloudinary hataları bazen http_code ile gelir
       return NextResponse.json({ message: `Cloudinary hatası: ${error.message || 'Bilinmeyen Cloudinary hatası'}` }, { status: error.http_code || 500 });
     }
    return NextResponse.json({ message: 'Dosya yüklenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}