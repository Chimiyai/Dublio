// src/app/api/admin/cloudinary-utils/delete-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ /* ... */ });

export async function POST(request: NextRequest) { // POST veya DELETE olabilir
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  try {
    const { publicIdToArchive, archiveToPublicId } = await request.json();

    if (!publicIdToArchive || !archiveToPublicId) {
      return NextResponse.json({ message: 'Eksik parametre: publicIdToArchive ve archiveToPublicId gerekli.' }, { status: 400 });
    }

    console.log(`Cloudinary'de arşivleniyor: ${publicIdToArchive} -> ${archiveToPublicId}`);
    const result = await cloudinary.uploader.rename(publicIdToArchive, archiveToPublicId, { resource_type: 'image', overwrite: false });
    
    return NextResponse.json({ message: 'Resim başarıyla arşivlendi.', newPublicId: result.public_id });

  } catch (error: any) {
    if (error.http_code === 404 && error.message?.includes("Resource not found")) {
        // Bu hata, silinmeye/arşivlenmeye çalışılan resmin zaten Cloudinary'de olmadığını gösterir.
        // Bu durumu bir hata olarak değil, "işlem gereksiz" olarak kabul edebiliriz.
        console.log(`Arşivlenecek resim Cloudinary'de bulunamadı: ${error.message.split('Resource not found - ')[1]}`);
        return NextResponse.json({ message: 'Arşivlenecek resim bulunamadı.' }, { status: 200 }); // Veya 404
    }
    console.error("Cloudinary arşivleme API hatası:", error);
    return NextResponse.json({ message: 'Resim arşivlenirken bir hata oluştu.', error: error.message }, { status: 500 });
  }
}