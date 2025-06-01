// src/app/api/admin/sanatcilar/profile-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions'; // authOptions yolunu kontrol et
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const generateUniqueFilenameForPublicId = (originalName: string, identifier?: string | null) => {
  const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const safeIdentifier = identifier ? identifier.toLowerCase().replace(/[^a-z0-9_]+/g, '_').substring(0, 30) : 'artist_profile';
  const cleanOriginalNameBase = nameWithoutExtension.toLowerCase().replace(/[^a-z0-9_]+/g, '_').substring(0, 50);
  return `${safeIdentifier}_${cleanOriginalNameBase}_${Date.now()}`.substring(0, 150);
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
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
      return NextResponse.json({ message: 'Geçersiz dosya tipi.' }, { status: 400 });
    }
    const maxFileSizeMB = 5; // Profil resimleri için
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return NextResponse.json({ message: `Maksimum ${maxFileSizeMB}MB.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniquePublicId = generateUniqueFilenameForPublicId(file.name, identifier);

    const result = await new Promise<UploadApiResponse | UploadApiErrorResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: uniquePublicId,
          folder: folder || 'artist_profiles',
          format: 'webp',
          quality: 'auto:good',
          eager: [{ width: 200, height: 200, crop: 'fill', gravity: 'face', format: 'webp' }, { width: 400, height: 400, crop: 'fill', gravity: 'face', format: 'webp' }]
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error("Cloudinary'den (artist profile) beklenmedik boş yanıt."));
        }
      ).end(buffer);
    });

    if ('error' in result || !result.public_id) {
      const errorMessage = ('error' in result && result.error?.message) ? result.error.message : 'Cloudinary profil resmi yüklemesi başarısız oldu.';
      throw new Error(errorMessage);
    }
    
    const successResult = result as UploadApiResponse;
    return NextResponse.json({ publicId: successResult.public_id });

  } catch (error: any) {
    console.error('Profil resmi API hatası:', error);
    return NextResponse.json({ message: error.message || 'Resim yüklenirken bir hata oluştu.' }, { status: 500 });
  }
}