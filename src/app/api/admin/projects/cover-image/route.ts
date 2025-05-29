// src/app/api/admin/projects/cover-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'; // <-- TİPLERİ BURAYA EKLE

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// streamToBuffer fonksiyonuna gerek kalmadı, direkt file.arrayBuffer() kullanıyoruz.
// async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> { ... }

const generateUniqueFilename = (originalName: string, identifier?: string | null) => {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'; // uzantıyı küçük harf yap
  const safeIdentifier = identifier ? identifier.toLowerCase().replace(/[^a-z0-9_]+/g, '_') : 'image';
  // Dosya adında geçersiz karakterler olmadığından emin ol
  const cleanOriginalNameBase = originalName.substring(0, originalName.lastIndexOf('.'))
                                      .toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  return `${safeIdentifier}_${cleanOriginalNameBase}_${Date.now()}`.substring(0, 100); // YENİ (uzantısız)
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 }); // 403 Forbidden daha uygun
  }

  try {
    const formData = await request.formData();
    const file = formData.get('imageFile') as File | null;
    const identifier = formData.get('identifier') as string | null;
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'Resim dosyası bulunamadı.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ message: 'Geçersiz dosya tipi. Lütfen bir resim yükleyin.' }, { status: 400 });
    }
    const maxFileSizeMB = 8;
    const maxSizeInBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return NextResponse.json({ message: `Dosya boyutu çok büyük. Maksimum ${maxFileSizeMB}MB.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueFilename = generateUniqueFilename(file.name, identifier);

    const result = await new Promise<UploadApiResponse | UploadApiErrorResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: uniqueFilename,
          folder: folder || undefined, // Eğer folder null/undefined ise Cloudinary kök dizinine yükler
          // overwrite: true, // Eğer aynı public_id varsa üzerine yaz (varsayılan false)
          // quality: 'auto', // Kalite ayarı
          // fetch_format: 'auto' // Format ayarı
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary yükleme hatası:', error);
            reject(error);
          } else if (result) { // result undefined gelme ihtimaline karşı kontrol
            resolve(result);
          } else {
            reject(new Error("Cloudinary'den beklenmedik boş yanıt."));
          }
        }
      ).end(buffer);
    });

    // Hata kontrolünü result objesinin yapısına göre yapalım
    if ('error' in result || !result.public_id || !result.secure_url) {
        const errorMessage = ('error' in result && result.error?.message) ? result.error.message : 'Cloudinary yüklemesi başarısız oldu veya sonuç eksik.';
        console.error('Cloudinary sonucu hatası veya eksik:', result);
        throw new Error(errorMessage);
    }

    // Başarılı durumda `result` UploadApiResponse tipinde olmalı
    const successResult = result as UploadApiResponse;

    return NextResponse.json({
      message: 'Resim başarıyla yüklendi.',
      imageUrl: successResult.secure_url,
      publicId: successResult.public_id,
    });
  } catch (error: any) { // Hata tipini any olarak alıp message'ı kontrol edelim
    console.error('Resim yükleme API genel hatası:', error);
    return NextResponse.json({ message: error.message || 'Resim yüklenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}