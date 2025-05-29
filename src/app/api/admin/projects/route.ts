// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { RoleInProject, Prisma } from '@prisma/client';

const createProjectSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz").max(191),
  slug: z.string().min(1, "Slug boş olamaz.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Geçersiz slug formatı.").max(191)
    .refine(async (slug) => {
        const existing = await prisma.project.findUnique({ where: { slug } });
        return !existing;
    }, { message: "Bu slug zaten kullanılıyor." }),
  type: z.enum(['oyun', 'anime']), // 'game' yerine 'oyun' kullandığınızı varsayıyorum
  description: z.string().max(5000).nullable().optional(),
  coverImagePublicId: z.string().max(255).nullable().optional(),
  bannerImagePublicId: z.string().max(255).nullable().optional(), // <<<< YENİ ALAN
  releaseDate: z.coerce.date().nullable().optional(),
  isPublished: z.boolean().optional().default(true),
  // Oyunlar için fiyatlandırma
  price: z.number().min(0, "Fiyat 0 veya pozitif olmalı.").nullable().optional(), // <<<< YENİ ALAN
  currency: z.string().length(3, "Para birimi 3 karakter olmalı (örn: TRY).").default("TRY").nullable().optional(), // <<<< YENİ ALAN
  
  assignments: z.array(z.object({
    artistId: z.number().int(),
    role: z.nativeEnum(RoleInProject)
  })).optional().default([]),
  // Kategori ID'lerini de alabiliriz (opsiyonel)
  categoryIds: z.array(z.number().int()).optional().default([]), // <<<< KATEGORİLER İÇİN
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsedBody = await createProjectSchema.safeParseAsync(body); // Async refine için safeParseAsync

    if (!parsedBody.success) {
      console.error("Zod validation errors (POST):", parsedBody.error.flatten());
      return NextResponse.json({ message: "Geçersiz veri.", errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { assignments, categoryIds, price, currency, ...projectData } = parsedBody.data;

    // Eğer tip 'anime' ise ve fiyat girilmişse, fiyatı null yap (ya da hata ver)
    let finalPrice = projectData.type === 'oyun' ? price : null;
    let finalCurrency = projectData.type === 'oyun' ? currency : null;
    if (projectData.type === 'anime' && price !== null && price !== undefined) {
        console.warn("Anime için fiyat girildi, null olarak ayarlanacak.");
    }

    const newProject = await prisma.project.create({
      data: {
        ...projectData,
        price: finalPrice,
        currency: finalCurrency,
        // releaseDate zaten Zod ile Date'e çevriliyor
        assignments: assignments && assignments.length > 0 ? {
          createMany: { data: assignments.map(a => ({ artistId: a.artistId, role: a.role })) },
        } : undefined,
        categories: categoryIds && categoryIds.length > 0 ? {
          create: categoryIds.map(catId => ({
            category: { connect: { id: catId } }
          }))
        } : undefined,
      },
      include: {
          assignments: { select: { artistId: true, role: true }},
          categories: { select: { category: { select: { id: true, name: true}} }}
      }
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error("Proje oluşturma hatası:", error);
    if (error instanceof z.ZodError) { // Zod refine hatası için
         return NextResponse.json({ message: "Geçersiz veri.", errors: error.flatten().fieldErrors }, { status: 400 });
    }
    // P2002 unique constraint hatası (slug için, Zod refine bunu yakalamalı ama garanti olsun)
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
         return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.'] } }, { status: 409 });
    }
    return NextResponse.json({ message: 'Proje oluşturulurken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}