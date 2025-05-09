// src/app/api/admin/projeler/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { RoleInProject } from '@prisma/client'; // Prisma Enum'unu import et

// --- Tip Tanımı (Opsiyonel ama yardımcı) ---
interface RouteContext {
  params: {
    slug: string;
  };
}

// --- Zod Şeması ---
const updateProjectSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz").max(191).optional(),
  slug: z.string().min(1, "Slug boş olamaz").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug sadece küçük harf, rakam ve tire içerebilir, tire ile başlayıp bitemez.").max(191).optional(),
  type: z.enum(['game', 'anime']).optional(),
  description: z.string().optional().nullable(), // Nullable olabilir
  coverImage: z.string().url("Geçerli bir URL olmalı").optional().or(z.literal('')).nullable(), // Nullable olabilir veya boş string
  releaseDate: z.coerce.date().optional(),
  isPublished: z.boolean().optional(),
  // assignedArtistIds yerine assignments: { artistId, role } dizisi
  assignments: z.array(z.object({
    artistId: z.number().int(),
    role: z.nativeEnum(RoleInProject) // Prisma enum'unu kullan
  })).optional(),
});

// --- API Metodları ---

// PUT (Güncelleme - Rollerle Birlikte)
export async function PUT(
  request: Request, // Request kullanmak daha standart
  { params }: RouteContext // Tip tanımını kullan
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  try {
    // Önce güncellenecek projeyi ID ile bulalım
    const currentProject = await prisma.project.findUnique({
      where: { slug: params.slug },
      select: { id: true } // Sadece ID yeterli
    });

    if (!currentProject) {
      return NextResponse.json({ message: 'Proje bulunamadı' }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = updateProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error("Zod Validation Errors:", parsedBody.error.flatten().fieldErrors);
      return NextResponse.json({ message: "Geçersiz veri gönderildi.", errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    // assignments verisini projectData'dan ayır
    const { assignments, ...projectData } = parsedBody.data;

    // Slug kontrolü (eğer değişmişse ve başka projede kullanılıyorsa)
    if (projectData.slug && projectData.slug !== params.slug) {
      const existingProjectWithNewSlug = await prisma.project.findUnique({
        where: { slug: projectData.slug },
        select: { id: true }
      });
      if (existingProjectWithNewSlug && existingProjectWithNewSlug.id !== currentProject.id) {
        return NextResponse.json({ errors: { slug: ['Bu slug zaten başka bir proje tarafından kullanılıyor.'] } }, { status: 409 }); // Conflict
      }
    }

    // Transaction ile Proje ve Atamaları Güncelle
    const updatedProjectResult = await prisma.$transaction(async (tx) => {
      // 1. Proje detaylarını güncelle (ID ile)
      const updatedProjectDetails = await tx.project.update({
        where: { id: currentProject.id }, 
        data: {
          ...projectData, 
          description: projectData.description === '' ? null : projectData.description,
          coverImage: projectData.coverImage === '' ? null : projectData.coverImage,
        },
      });

      // 2. Sanatçı atamalarını güncelle (eğer body'de assignments geldiyse)
      if (assignments !== undefined) {
        // Mevcut atamaları sil
        await tx.projectAssignment.deleteMany({
          where: { projectId: currentProject.id },
        });

        // Yeni atamaları ekle (eğer varsa)
        if (assignments.length > 0) {
          await tx.projectAssignment.createMany({
            data: assignments.map(assignment => ({
              projectId: currentProject.id, 
              artistId: assignment.artistId,
              role: assignment.role, 
            })),
            // skipDuplicates: true, // BU SATIRI KALDIR/YORUMA AL
          });
        }
      }
      // Sonucu döndür
      return updatedProjectDetails;
    });


    // Başarılı yanıt
    return NextResponse.json(updatedProjectResult, { status: 200 });

  } catch (error: any) {
    console.error(`Proje (slug: ${params.slug}) güncelleme hatası:`, error);
    // Prisma Hata Kodları
    if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
        return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor (DB constraint).'] } }, { status: 409 });
    }
    if (error?.code === 'P2025') { // Kayıt bulunamadı
         return NextResponse.json({ message: 'Güncellenecek proje bulunamadı.' }, { status: 404 });
    }
     if (error instanceof z.ZodError) { // Bu aslında safeParse ile yakalanıyor ama ek kontrol
      return NextResponse.json({ message: "Veri doğrulama hatası.", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Proje güncellenirken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}

// GET (Detay Getirme - Rollerle Birlikte)
export async function GET(
  request: NextRequest, // GET için NextRequest kalabilir
  { params }: RouteContext
) {
  // Yetkilendirme (Admin veya belki giriş yapmış herkes?)
  const session = await getServerSession(authOptions);
  // NOT: Herkesin görmesi için bu kontrol kaldırılabilir veya farklı bir role bakılabilir.
  if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const slug = params.slug;
  try {
      const project = await prisma.project.findUnique({
          where: { slug: slug },
          include: {
              // Atamaları ve rollerini getir
              assignments: {
                  select: {
                      artistId: true,
                      role: true,
                      // İsteğe bağlı: Sanatçı adını da burada çekebiliriz (formda tüm sanatçılar zaten var)
                      // artist: { select: { id: true, firstName: true, lastName: true } }
                  }
              }
          }
      });

      if (!project) {
          return NextResponse.json({ message: "Proje bulunamadı." }, { status: 404 });
      }

      // API yanıtı olarak doğrudan project objesini döndür, assignments dahil
      return NextResponse.json(project, { status: 200 });

  } catch (error) {
      console.error(`Proje (slug: ${slug}) getirilirken hata:`, error);
      return NextResponse.json({ message: "Proje getirilirken bir sunucu hatası oluştu." }, { status: 500 });
  }
}

// DELETE (Silme)
export async function DELETE(
  request: NextRequest, // DELETE için NextRequest kalabilir
  { params }: RouteContext
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const slugToDelete = params.slug;

  try {
    // Transaction kullanmak daha güvenli olabilir ama Cascade ile de çalışmalı
    // Eğer Cascade ile sorun yaşanırsa:
    // await prisma.$transaction(async (tx) => {
    //   const projectToDelete = await tx.project.findUnique({ where: { slug: slugToDelete }, select: { id: true } });
    //   if (!projectToDelete) throw new Error('P2025'); // Hata kodunu manuel fırlat
    //   await tx.projectAssignment.deleteMany({ where: { projectId: projectToDelete.id } });
    //   await tx.project.delete({ where: { id: projectToDelete.id } });
    // });

    const deletedProject = await prisma.project.delete({
      where: { slug: slugToDelete },
    });
    // Cascade silme sayesinde ilgili ProjectAssignment kayıtları da silinmeli.

    return NextResponse.json({ message: `"${deletedProject.title}" başlıklı proje başarıyla silindi.` }, { status: 200 });

  } catch (error: any) {
    console.error(`Proje (slug: ${slugToDelete}) silme hatası:`, error);
    // Prisma P2025: Silinecek kayıt bulunamadı
    if (error.code === 'P2025' || error.message === 'P2025') {
      return NextResponse.json({ message: 'Silinecek proje bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Proje silinirken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}