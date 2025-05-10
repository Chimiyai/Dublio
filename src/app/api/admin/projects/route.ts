// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod'; // Zod'u import et (eğer validasyon için kullanacaksan)
import { RoleInProject } from '@prisma/client';

// Zod ile validasyon şeması (opsiyonel ama önerilir)
const createProjectSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  slug: z.string().min(1, "Slug zorunludur.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug sadece küçük harf, rakam ve tire içerebilir ve tire ile başlayıp bitemez."),
  type: z.enum(['game', 'anime'], { message: "Tür 'game' veya 'anime' olmalıdır." }),
  description: z.string().nullable().optional(),
  coverImage: z.string().url({ message: "Geçerli bir kapak resmi URL'si girin." }).nullable().optional(), // Artık tam URL bekliyoruz
  coverImagePublicId: z.string().nullable().optional(), // Public ID de gelebilir
  releaseDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: "Geçersiz yayın tarihi formatı.",
  }),
  isPublished: z.boolean().optional().default(true),
  assignments: z.array(z.object({ // <-- Bu isim önemli
    artistId: z.number().int(),
    role: z.nativeEnum(RoleInProject)
  })).optional().default([]),
  
});


export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Zod ile validasyon
    const validation = createProjectSchema.safeParse(body);
    if (!validation.success) {
      // Zod hatalarını daha kullanıcı dostu bir formata dönüştürebiliriz
      const errors: { [key: string]: string[] } = {};
      validation.error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return NextResponse.json({ message: 'Doğrulama hatası', errors }, { status: 400 });
    }

    const { // Destructuring doğru
      title,
      slug,
      type,
      description,
      coverImage,
      coverImagePublicId,
      releaseDate,
      isPublished,
      assignments // Bu, client'tan gelen ve Zod ile doğrulanmış assignments dizisi
    } = validation.data;

    const existingProjectBySlug = await prisma.project.findUnique({
      where: { slug },
    });
    if (existingProjectBySlug) {
      return NextResponse.json(
        { message: 'Bu URL metni (slug) zaten kullanılıyor.', errors: {slug: ['Bu URL metni (slug) zaten kullanılıyor.']} },
        { status: 409 } // Conflict
      );
    }

    const newProject = await prisma.project.create({
      data: {
        title,
        slug,
        type,
        description,
        coverImage,
        coverImagePublicId,
        releaseDate: new Date(releaseDate),
        isPublished,
        // ProjectAssignment kayıtlarını oluştur
        assignments: { 
          createMany: { 
            // Zod'dan gelen `assignments` dizisini burada kullanıyoruz.
            // Bu `assignments` değişkeni yukarıda destruct edilmişti.
            data: assignments.map(assignment => ({ 
              artistId: assignment.artistId,
              role: assignment.role,
            })),
            // skipDuplicates: true, // Opsiyonel
          },
        },
      },
      include: { 
        assignments: true,
      }
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Proje oluşturma hatası:', error);
    if (error instanceof z.ZodError) { // Zod hatası ise
        return NextResponse.json({ message: 'Geçersiz veri.', errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Proje oluşturulurken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}

// GET fonksiyonu aynı kalabilir...
export async function GET(request: NextRequest) {
    // ... (GET içeriği) ...
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
    }
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(projects, { status: 200 });
    } catch (error) {
        console.error("Projeler getirilirken hata:", error);
        return NextResponse.json({ message: "Projeler getirilirken bir hata oluştu." }, { status: 500 });
    }
}