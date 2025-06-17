// src/app/api/admin/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { RoleInProject } from '@prisma/client';

const createProjectSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz").max(191),
  slug: z.string().min(1, "Slug boş olamaz.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Geçersiz slug formatı.").max(191)
    .refine(async (slug) => {
        const existing = await prisma.project.findUnique({ where: { slug } });
        return !existing;
    }, { message: "Bu slug zaten kullanılıyor." }),
  type: z.enum(['oyun', 'anime']),
  description: z.string().max(5000).nullable().optional(),
  coverImagePublicId: z.string().max(255).nullable().optional(),
  bannerImagePublicId: z.string().max(255).nullable().optional(),
  releaseDate: z.coerce.date().nullable().optional(),
  isPublished: z.boolean().optional().default(true),
  price: z.number().min(0, "Fiyat 0 veya pozitif olmalı.").nullable().optional(),
  currency: z.string().length(3, "Para birimi 3 karakter olmalı (örn: TRY).").default("TRY").nullable().optional(),
  trailerUrl: z.string().url({ message: "Fragman URL'i geçerli bir URL formatında olmalıdır." }).nullable().optional().transform(val => val === '' ? null : val),
  assignments: z.array(z.object({
    artistId: z.number().int(),
    role: z.nativeEnum(RoleInProject)
  })).optional().default([]),
  categoryIds: z.array(z.number().int()).optional().default([]),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsedBody = await createProjectSchema.safeParseAsync(body);

    if (!parsedBody.success) {
      console.error("Zod validation errors (POST):", parsedBody.error.flatten());
      return NextResponse.json({ message: "Geçersiz veri.", errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { assignments, categoryIds, price, ...projectData } = parsedBody.data;

    const finalPrice = projectData.type === 'oyun' ? price : null;
    const finalCurrency = projectData.type === 'oyun' ? (projectData.currency || 'TRY') : null;

    // --- YENİ TRANSACTION MANTIĞI ---
    const newProject = await prisma.$transaction(async (tx) => {
        // 1. Projeyi oluştur
        const createdProject = await tx.project.create({
            data: {
                ...projectData,
                price: finalPrice,
                currency: finalCurrency,
                // `trailerUrl` ve diğerleri zaten `projectData` içinde
                assignments: assignments && assignments.length > 0 ? {
                    createMany: { data: assignments.map(a => ({ artistId: a.artistId, role: a.role })) },
                } : undefined,
                categories: categoryIds && categoryIds.length > 0 ? {
                    create: categoryIds.map(catId => ({
                        category: { connect: { id: catId } }
                    }))
                } : undefined,
            },
        });

        // 2. Eğer proje "Yayında" olarak oluşturulduysa bildirimleri oluştur
        if (createdProject.isPublished) {
            const newNotification = await tx.notification.create({
                data: {
                    message: `Yeni bir proje yayınlandı: ${createdProject.title}`,
                    link: `/projeler/${createdProject.slug}`,
                },
            });

            const allUserIds = await tx.user.findMany({
                where: { role: 'user' }, // Sadece normal kullanıcılara bildirim gönderelim
                select: { id: true },
            });

            if (allUserIds.length > 0) {
                await tx.userNotification.createMany({
                    data: allUserIds.map(user => ({
                        userId: user.id,
                        notificationId: newNotification.id,
                        isRead: false,
                    })),
                });
                console.log(`Yeni proje için ${allUserIds.length} kullanıcıya bildirim oluşturuldu.`);
            }
        }
        
        return createdProject;
    });
    // --- TRANSACTION SONU ---

    // Client'a sadece proje verisini döndürmek yeterli, include'a gerek yok
    return NextResponse.json(newProject, { status: 201 });

  } catch (error: any) {
    console.error("Proje oluşturma hatası:", error);
    if (error instanceof z.ZodError) { 
        return NextResponse.json({ message: "Geçersiz veri.", errors: error.flatten().fieldErrors }, { status: 400 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.'] } }, { status: 409 });
    }
    return NextResponse.json({ message: 'Proje oluşturulurken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}