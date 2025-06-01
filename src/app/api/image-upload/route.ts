// src/app/api/image-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions'; // Yolunu kontrol et
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const generateUniqueFilenameForPublicId = (originalName: string, identifier?: string | null, contextPrefix?: string) => {
  const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const safeContextPrefix = contextPrefix ? contextPrefix.toLowerCase().replace(/[^a-z0-9_]+/g, '_') : 'img';
  const safeIdentifier = identifier ? identifier.toLowerCase().replace(/[^a-z0-9_]+/g, '_').substring(0, 30) : '';
  
  const cleanOriginalNameBase = nameWithoutExtension
                                  .toLowerCase()
                                  .replace(/[^a-z0-9_]+/g, '_')
                                  .substring(0, 40); // Biraz daha kısalttım
  
  // context_identifier_original_timestamp
  let publicIdParts = [safeContextPrefix];
  if (safeIdentifier) publicIdParts.push(safeIdentifier);
  publicIdParts.push(cleanOriginalNameBase);
  publicIdParts.push(Date.now().toString());
  
  return publicIdParts.join('_').substring(0, 150); // Uzunluk kontrolü
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim: Oturum bulunamadı.' }, { status: 401 });
  }
  const userId = session.user.id; // String veya number olabilir, DB'ye göre ayarla

  try {
    const formData = await request.formData();
    const file = formData.get('imageFile') as File | null;
    const uploadContext = formData.get('uploadContext') as string | null;
    // 'identifier' formdaki bir 'id' (userId, projectId, artistId) veya bir 'slug' olabilir.
    const identifierFromForm = formData.get('identifier') as string | null; 

    if (!file || !uploadContext) {
      return NextResponse.json({ message: 'Eksik parametreler: Resim dosyası ve yükleme bağlamı (uploadContext) gerekli.' }, { status: 400 });
    }

    let targetFolder = 'genel_yuklemeler';
    let maxFileSizeMB = 8; // Varsayılan
    let eagerTransformations: any[] = [];
    let finalIdentifierForFilename = identifierFromForm; // Dosya adı için kullanılacak ID

    // uploadContext'e göre yetkilendirme ve ayarlar
    switch (uploadContext) {
      case 'userProfile':
        // Kullanıcı kendi profil resmini yüklüyor. identifierFromForm'un userId ile eşleştiğini kontrol et.
        if (identifierFromForm !== userId.toString()) {
             return NextResponse.json({ message: 'Yetkisiz işlem: Başkasının profil resmini değiştiremezsiniz.' }, { status: 403 });
        }
        targetFolder = `user_profiles/${userId}`; // Her kullanıcı için güvenli bir alt klasör
        maxFileSizeMB = 2;
        eagerTransformations = [{ width: 150, height: 150, crop: 'fill', gravity: 'face', format: 'webp' }];
        break;
      case 'userBanner':
        if (identifierFromForm !== userId.toString()) {
            return NextResponse.json({ message: 'Yetkisiz işlem: Başkasının bannerını değiştiremezsiniz.' }, { status: 403 });
        }
        targetFolder = `user_banners/${userId}`;
        maxFileSizeMB = 5;
        eagerTransformations = [{ width: 1200, height: 300, crop: 'fill', gravity: 'auto', format: 'webp' }]; // Banner için oran
        break;
      case 'artistProfile':
        if (session.user.role !== 'admin') {
          return NextResponse.json({ message: 'Yetkisiz işlem: Sadece adminler sanatçı resmi yükleyebilir.' }, { status: 403 });
        }
        targetFolder = 'artist_profiles'; // Veya `artist_profiles/${identifierFromForm}`
        maxFileSizeMB = 5;
        eagerTransformations = [{ width: 200, height: 200, crop: 'fill', gravity: 'face', format: 'webp' }];
        break;
      case 'projectCover':
        if (session.user.role !== 'admin') {
          return NextResponse.json({ message: 'Yetkisiz işlem: Sadece adminler proje kapak resmi yükleyebilir.' }, { status: 403 });
        }
        targetFolder = 'project_covers'; // Veya `project_covers/${identifierFromForm}`
        maxFileSizeMB = 8;
        eagerTransformations = [{ width: 800, height: 450, crop: 'limit', format: 'webp' }];
        break;
      // İleride proje banner'ı için:
      // case 'projectBanner':
      //   if (session.user.role !== 'admin') { /* ... */ }
      //   targetFolder = 'project_banners';
      //   maxFileSizeMB = 5;
      //   eagerTransformations = [{ width: 1500, height: 500, crop: 'fill', gravity: 'auto', format: 'webp' }];
      //   break;
      default:
        return NextResponse.json({ message: 'Geçersiz yükleme bağlamı.' }, { status: 400 });
    }
    
    if (!file.type.startsWith('image/')) { /* ... tip hatası ... */ }
    if (file.size > maxFileSizeMB * 1024 * 1024) { /* ... boyut hatası ... */ }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // Dosya adını oluştururken context ve identifier kullan
    const uniquePublicId = generateUniqueFilenameForPublicId(file.name, finalIdentifierForFilename, uploadContext);

    const result = await new Promise<UploadApiResponse | UploadApiErrorResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        resource_type: 'image',
        public_id: uniquePublicId, // Uzantısız
        folder: targetFolder,      // Dinamik klasör
        format: 'webp',            // Her zaman WebP
        quality: 'auto:good',
        eager: eagerTransformations.length > 0 ? eagerTransformations : undefined,
        overwrite: false, // Aynı public_id varsa hata ver (bizim ID'ler benzersiz olmalı)
      }, (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new Error("Cloudinary'den beklenmedik boş yanıt."));
      }).end(buffer);
    });

    if ('error' in result || !result.public_id) {
      const errorMessage = ('error' in result && result.error?.message) ? result.error.message : 'Cloudinary yüklemesi başarısız oldu veya sonuç eksik.';
      console.error(`Cloudinary Yükleme Hatası (${uploadContext}):`, result);
      throw new Error(errorMessage);
    }
    
    const successResult = result as UploadApiResponse;

    return NextResponse.json({
      message: 'Resim başarıyla yüklendi.',
      publicId: successResult.public_id, // Klasör + uzantısız dosya adı
    });

  } catch (error: any) {
    console.error(`Genel Resim Yükleme API Hatası (${(request.formData().then(fd => fd.get('uploadContext')) || 'bilinmiyor')}):`, error);
    return NextResponse.json({ message: error.message || 'Resim yüklenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}