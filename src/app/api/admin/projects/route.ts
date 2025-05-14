// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { RoleInProject, Prisma } from '@prisma/client';

const createProjectSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz").max(191),
  slug: z.string().min(1, "Slug boş olamaz.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(191)
    .refine(async (slug) => { // Slug'ın benzersizliğini kontrol et
        const existing = await prisma.project.findUnique({ where: { slug } });
        return !existing;
    }, { message: "Bu slug zaten kullanılıyor." }),
  type: z.enum(['game', 'anime']),
  description: z.string().max(5000).nullable().optional(),
  coverImagePublicId: z.string().max(255).nullable().optional(),
  releaseDate: z.coerce.date().nullable().optional(), // coerce.date string'i Date'e çevirir
  isPublished: z.boolean().optional().default(true),
  assignments: z.array(z.object({ // assignments'ı da alacak şekilde güncelle
    artistId: z.number().int(),
    role: z.nativeEnum(RoleInProject)
  })).optional().default([]), // Varsayılan boş array
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
      return NextResponse.json({ message: "Geçersiz veri.", errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { assignments, ...projectData } = parsedBody.data;

    const newProject = await prisma.project.create({
      data: {
        ...projectData,
        // releaseDate: projectData.releaseDate ? new Date(projectData.releaseDate) : null, // Zod coerce.date bunu zaten yapıyor
        assignments: assignments && assignments.length > 0 ? {
          createMany: {
            data: assignments.map(a => ({
              artistId: a.artistId,
              role: a.role,
            })),
          },
        } : undefined, // Eğer assignments yoksa veya boşsa, bu alanı ekleme
      },
      include: { // Dönen veride assignments'ı da görmek isteyebilirsin
          assignments: { select: { artistId: true, role: true }}
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