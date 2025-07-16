//src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'Dosya bulunamadı.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosyayı projenin `public` klasörüne kaydedeceğiz.
    // Bu, dosyaya doğrudan URL üzerinden erişmemizi sağlar.
    // Örn: http://localhost:3000/uploads/dosya-adi.mp3
    const filename = Date.now() + '_' + file.name.replace(/\s+/g, '_');
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const filepath = path.join(uploadsDir, filename);
    
    // Not: Gerçekte, uploadsDir var mı diye kontrol etmek iyi bir fikirdir.
    // Şimdilik projenin kök dizininde `public/uploads` klasörünü manuel oluşturduğumuzu varsayıyoruz.
    await writeFile(filepath, buffer);

    // Client'a, dosyaya erişebileceği public URL'i geri döndürüyoruz.
    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return NextResponse.json({ success: false, message: 'Yükleme sırasında hata oluştu.' }, { status: 500 });
  }
}