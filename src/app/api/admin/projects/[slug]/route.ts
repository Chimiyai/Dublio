// src/app/api/admin/projects/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { RoleInProject, Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

// --- Cloudinary ve Zod Şeması (Bu kısımlar doğru, olduğu gibi kalıyor) ---
if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
} else {
    console.warn("Cloudinary environment variables are not fully set. Image operations might fail.");
}

const updateProjectSchema = z.object({
  title: z.string().min(1, "Başlık gerekli.").max(191).optional(),
  slug: z.string().min(1, "Slug gerekli.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug geçersiz formatta.").max(191).optional(),
  type: z.enum(['oyun', 'anime'], { errorMap: () => ({ message: "Tür 'oyun' veya 'anime' olmalı."}) }).optional(),
  description: z.string().max(5000).nullable().optional(),
  coverImagePublicId: z.string().max(255).nullable().optional(),
  bannerImagePublicId: z.string().max(255).nullable().optional(),
  releaseDate: z.coerce.date({ errorMap: () => ({ message: "Geçersiz tarih formatı."}) }).nullable().optional(),
  isPublished: z.boolean().optional(),
  price: z.number().min(0, "Fiyat negatif olamaz.").nullable().optional(),
  currency: z.string().length(3, "Para birimi 3 karakter olmalı.").nullable().optional(),
  externalWatchUrl: z.string().url({ message: "Geçersiz URL formatı." }).or(z.literal('')).nullable().optional().transform(val => val === '' ? null : val),
  trailerUrl: z.string().url({ message: "Fragman URL'i geçerli bir URL formatında olmalıdır." }).nullable().optional().transform(val => val === '' ? null : val),
  assignments: z.array(z.object({
    artistId: z.number().int("Sanatçı ID'si tam sayı olmalı."),
    role: z.nativeEnum(RoleInProject, { errorMap: () => ({ message: "Geçersiz rol."}) }),
    characterIds: z.array(z.number().int("Karakter ID'si tam sayı olmalı.")).optional(),
  })).optional(),
  categoryIds: z.array(z.number().int("Kategori ID'si tam sayı olmalı.")).optional(),
});

const getArchivePublicId = (oldPublicId: string | null | undefined, typePrefix: string): string | null => {
    if (!oldPublicId) return null;
    const baseArchiveFolder = 'kullanilmayanlar';
    let filenamePart = oldPublicId;
    let originalFolderPath = '';
    if (oldPublicId.includes('/')) {
        const parts = oldPublicId.split('/');
        filenamePart = parts.pop() || oldPublicId;
        if (parts.length > 0) originalFolderPath = parts.join('/') + '/';
    }
    const newPublicId = `${baseArchiveFolder}/${originalFolderPath}${typePrefix}_${filenamePart}_${Date.now()}`;
    return newPublicId.substring(0, 200);
};

// --- PUT (Projeyi güncelle) ---
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> } // <<< ÇALIŞAN YAPI
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    if (!slug) {
      return NextResponse.json({ message: 'Eksik proje slug parametresi.' }, { status: 400 });
    }

    const currentProject = await prisma.project.findUnique({
      where: { slug: slug },
      select: { id: true, type: true, slug: true }
    });

    if (!currentProject) {
      return NextResponse.json({ message: 'Güncellenecek proje bulunamadı.' }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = updateProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error("API Proje Güncelleme - Zod Hataları:", parsedBody.error.flatten().fieldErrors);
      return NextResponse.json({ message: "Geçersiz veri.", errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { 
        assignments: newAssignmentsData, 
        categoryIds: newCategoryIds,
        ...projectData
    } = parsedBody.data;
    
    const projectUpdatePayload: Prisma.ProjectUpdateInput = { ...projectData };

    const finalProjectType = projectData.type || currentProject.type;
    
    if (finalProjectType === 'anime') {
        projectUpdatePayload.price = null; 
        projectUpdatePayload.currency = null;
    }
    
    if (projectData.slug && projectData.slug !== currentProject.slug) {
        const existingSlug = await prisma.project.findFirst({
            where: { slug: projectData.slug, NOT: { id: currentProject.id } }
        });
        if (existingSlug) {
            return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.']}}, { status: 409 });
        }
    }

    const finalUpdatedProject = await prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
          where: { id: currentProject.id },
          data: projectUpdatePayload,
      });

      if (newCategoryIds !== undefined) {
          await tx.projectCategory.deleteMany({ where: { projectId: currentProject.id } });
          if (newCategoryIds.length > 0) {
            await tx.projectCategory.createMany({
                data: newCategoryIds.map(catId => ({
                  projectId: currentProject.id,
                  categoryId: catId,
                }))
            });
          }
      }

      if (newAssignmentsData !== undefined) {
          const oldAssignments = await tx.projectAssignment.findMany({
              where: { projectId: currentProject.id }, select: { id: true }
          });
          if (oldAssignments.length > 0) {
              await tx.voiceAssignment.deleteMany({
                  where: { projectAssignmentId: { in: oldAssignments.map(a => a.id) } }
              });
          }
          await tx.projectAssignment.deleteMany({ where: { projectId: currentProject.id } });

          if (newAssignmentsData.length > 0) {
            for (const assignmentData of newAssignmentsData) {
              const createdPa = await tx.projectAssignment.create({
                data: {
                  projectId: currentProject.id,
                  artistId: assignmentData.artistId,
                  role: assignmentData.role,
                },
              });
              if (assignmentData.role === RoleInProject.VOICE_ACTOR && assignmentData.characterIds?.length) {
                // Karakter atama mantığını buraya ekleyebilirsiniz
                const validChars = await tx.projectCharacter.findMany({
                    where: { id: { in: assignmentData.characterIds }, projectId: currentProject.id },
                    select: { id: true }
                });
                const vaData = validChars.map(vc => ({
                  projectAssignmentId: createdPa.id,
                  projectCharacterId: vc.id,
                }));
                if (vaData.length > 0) await tx.voiceAssignment.createMany({ data: vaData });
              }
            }
          }
      }

      return tx.project.findUniqueOrThrow({
        where: { id: updatedProject.id },
        include: { 
          assignments: { include: { artist: true, voiceRoles: { include: { character: true } } } },
          categories: { include: { category: true }},
        }
      });
    });

    return NextResponse.json(finalUpdatedProject, { status: 200 });

  } catch (error: any) {
    // Şimdi `slug` değişkeni burada tanınıyor olacak.
    console.error(`API Proje PUT (slug: ${slug}) hatası:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && error.meta?.target === 'Project_slug_key') { // Daha spesifik kontrol
            return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.'] } }, { status: 409 });
        }
        if (error.code === 'P2025') {
            return NextResponse.json({ message: 'Güncellenecek proje veya ilişkili bir kayıt bulunamadı.' }, { status: 404 });
        }
    }
    return NextResponse.json({ message: 'Proje güncellenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}


// --- GET Metodu (Proje detaylarını admin için getirme) ---
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> } // <<< ÇALIŞAN YAPI
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params;
  const projectSlug = resolvedParams.slug;

  if (!projectSlug) {
    return NextResponse.json({ message: 'Eksik proje slug parametresi.' }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      // ... (include bloğu aynı)
    });

    if (!project) {
      return NextResponse.json({ message: "Proje bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error(`API Proje GET (slug: ${projectSlug}) hatası:`, error);
    return NextResponse.json({ message: "Proje getirilirken bir hata oluştu." }, { status: 500 });
  }
}

// --- DELETE Metodu (Projeyi silme) ---
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> } // <<< ÇALIŞAN YAPI
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params;
  const slugToDelete = resolvedParams.slug;

  if (!slugToDelete) {
    return NextResponse.json({ message: 'Eksik proje slug parametresi.' }, { status: 400 });
  }

  try {
    const projectToDelete = await prisma.project.findUnique({
      where: { slug: slugToDelete },
      select: { id: true, title: true, coverImagePublicId: true, bannerImagePublicId: true, ProjectImage: {select: {publicId: true}} }
    });

    if (!projectToDelete) {
      return NextResponse.json({ message: 'Silinecek proje bulunamadı.' }, { status: 404 });
    }
    
    // Önce ilişkili resimleri Cloudinary'den sil/arşivle
    const imagesToArchiveOrDelete: string[] = [];
    if (projectToDelete.coverImagePublicId) imagesToArchiveOrDelete.push(projectToDelete.coverImagePublicId);
    if (projectToDelete.bannerImagePublicId) imagesToArchiveOrDelete.push(projectToDelete.bannerImagePublicId);
    projectToDelete.ProjectImage.forEach(img => imagesToArchiveOrDelete.push(img.publicId));

    for (const publicId of imagesToArchiveOrDelete) {
        const archivePublicId = getArchivePublicId(publicId, 'proje_silinen');
        if (archivePublicId) {
            try {
                await cloudinary.uploader.rename(publicId, archivePublicId, { resource_type: 'image', overwrite: false });
            } catch (renameError: any) {
                 console.error(`Cloudinary arşivleme hatası (${publicId}):`, renameError.message);
            }
        }
    }

    // Sonra veritabanından sil (ilişkili kayıtlar onDelete: Cascade ile silinmeli)
    await prisma.project.delete({
      where: { slug: slugToDelete },
    });
    
    return NextResponse.json({ message: `"${projectToDelete.title}" başlıklı proje başarıyla silindi.` });
  } catch (error: any) {
    console.error(`Proje (slug: ${slugToDelete}) silme hatası:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            return NextResponse.json({ message: 'Silinecek proje bulunamadı (delete sırasında).' }, { status: 404 });
        }
        if (error.code === 'P2003') { 
            return NextResponse.json({ message: 'Bu proje başka verilerle ilişkili olduğu için silinemedi.'}, {status: 409});
        }
    }
    return NextResponse.json({ message: 'Proje silinirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}