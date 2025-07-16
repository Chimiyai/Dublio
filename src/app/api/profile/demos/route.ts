//src/app/api/profile/demos/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { DemoType } from '@prisma/client'; // DemoType enum'ını import et

// Yeni demo oluşturma şeması
const createDemoSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır.").max(100),
  description: z.string().max(500, "Açıklama en fazla 500 karakter olabilir.").optional(),
  type: z.nativeEnum(DemoType), // AUDIO, VIDEO, IMAGE
  url: z.string().url("Geçerli bir URL girmelisiniz."), // Cloudinary veya YouTube/Vimeo linki
});

// Demo silme şeması
const deleteDemoSchema = z.object({
  demoId: z.number().int().positive(),
});


// YENİ BİR DEMO OLUŞTURMA
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz işlem', { status: 401 });
    }
    const authorId = parseInt(session.user.id, 10);

    const body = await request.json();
    const validation = createDemoSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ message: "Geçersiz veri", errors: validation.error.flatten().fieldErrors }), { status: 400 });
    }
    
    // Veritabanına yeni demoyu ekle
    const newDemo = await prisma.userDemo.create({
      data: {
        authorId: authorId,
        ...validation.data,
      }
    });

    return NextResponse.json(newDemo, { status: 201 });

  } catch (error) {
    console.error("[DEMO_POST_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}

// MEVCUT BİR DEMOYU SİLME
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return new NextResponse('Yetkisiz işlem', { status: 401 });
        }
        const userId = parseInt(session.user.id, 10);

        const body = await request.json();
        const validation = deleteDemoSchema.safeParse(body);
        
        if(!validation.success){
            return new NextResponse(JSON.stringify({ message: "Geçersiz Demo ID" }), { status: 400 });
        }
        const { demoId } = validation.data;

        // Demoyu silmeden önce, bu demonun gerçekten bu kullanıcıya ait olup olmadığını kontrol et.
        // Bu çok önemli bir güvenlik adımıdır!
        const demoToDelete = await prisma.userDemo.findUnique({
            where: { id: demoId }
        });

        if(!demoToDelete || demoToDelete.authorId !== userId) {
            return new NextResponse('Bu işlemi yapma yetkiniz yok.', { status: 403 }); // 403 Forbidden
        }

        // Not: Eğer dosyalar Cloudinary'e yüklendiyse, buradan Cloudinary API'ını çağırıp
        // o dosyayı da silmek en iyi pratiktir. Şimdilik bu adımı atlıyoruz.

        await prisma.userDemo.delete({
            where: { id: demoId },
        });

        return new NextResponse(JSON.stringify({ message: 'Demo başarıyla silindi' }), { status: 200 });

    } catch (error) {
        console.error("[DEMO_DELETE_ERROR]", error);
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}