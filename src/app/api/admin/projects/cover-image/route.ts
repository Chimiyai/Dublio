// src/app/api/admin/projeler/cover-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';
// prisma'ya bu endpoint'te doğrudan ihtiyacımız olmayabilir, çünkü sadece URL döndüreceğiz.
// URL'yi veritabanına kaydetme işini Proje Ekleme/Düzenleme API'si yapacak.

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') { // Sadece adminler yükleyebilsin
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('coverImageFile') as File | null; // Formdan gelen dosyanın adı
    const projectIdOrSlug = formData.get('projectIdOrSlug') as string | null; // Yüklenecek projenin ID'si veya slug'ı

    if (!file) {
      return NextResponse.json({ message: 'Dosya yüklenmedi.' }, { status: 400 });
    }
    if (!projectIdOrSlug) {
        return NextResponse.json({ message: 'Proje kimliği belirtilmedi.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
         return NextResponse.json({ message: 'Sadece resim dosyaları yüklenebilir.' }, { status: 400 });
    }
     // Kapak resmi için farklı bir boyut limiti (örn: 8MB)
     const maxSizeInBytes = 8 * 1024 * 1024; 
     if (file.size > maxSizeInBytes) {
       return NextResponse.json({ message: `Dosya boyutu çok büyük. Maksimum ${maxSizeInBytes / (1024 * 1024)}MB olabilir.` }, { status: 400 });
     }

    const fileBuffer = await streamToBuffer(file.stream());

    const uploadResult = await new Promise<{ secure_url?: string; public_id?: string; [key: string]: any } | undefined>((resolve, reject) => {
       cloudinary.uploader.upload_stream(
        {
          folder: 'prestij_dublaj/project_covers',
          public_id: `project_${projectIdOrSlug}_cover`, // Benzersiz ID için proje ID/slug kullan
          overwrite: true,
          format: 'webp', 
          transformation: [ // Kapak resimleri için uygun transformasyonlar
            { width: 1200, crop: 'limit' }, // Genişliği sınırla, oranı koru
            { quality: 'auto:good' }       // Kaliteyi otomatik ayarla
          ]
        },
        (error, result) => { 
          if (error) {
             console.error("Cloudinary SDK upload_stream error:", error); // Daha detaylı log
            // Hata objesini doğrudan reject et ki dış try-catch yakalasın
            return reject(new Error(error.message || 'Cloudinary yükleme hatası (stream)')); 
          }
          resolve(result);
        }
      ).end(fileBuffer);
    });
    
    if (!uploadResult?.secure_url || !uploadResult?.public_id) {
         console.error("Cloudinary yükleme sonucu hatalı veya gerekli bilgiler eksik:", uploadResult);
         // Bu durumda da spesifik bir hata fırlatabiliriz
         throw new Error('Cloudinary yüklemesi başarısız oldu veya URL/PublicID alınamadı.');
    }

    return NextResponse.json({ 
        message: 'Kapak resmi başarıyla yüklendi ve bilgiler alındı.', 
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
    }, { status: 200 });

  } catch (error: any) {
    console.error('GENEL Kapak resmi yükleme API hatası:', error);
    // Hata mesajını ve tipini logla
    console.error('Hata tipi:', typeof error, 'Hata string:', String(error));
    
    // Zaten bir NextResponse döndürülmüşse (bu pek olası değil ama)
    if (error instanceof NextResponse) {
        return error;
    }

    let errorMessage = 'Kapak resmi yüklenirken bir sunucu hatası oluştu.';
    if (error.message?.includes('Cloudinary') || error.http_code) { 
       errorMessage = `Cloudinary hatası: ${error.message || 'Bilinmeyen Cloudinary hatası'}`;
    } else if (typeof error.message === 'string') {
       errorMessage = error.message;
    }

    return NextResponse.json({ message: errorMessage, errorDetail: String(error) }, { status: 500 });
  }
}