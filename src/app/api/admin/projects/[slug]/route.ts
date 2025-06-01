// src/app/api/admin/projects/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions'; // authOptions yolunu kontrol et
import { z } from 'zod';
import { RoleInProject, Prisma } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary konfigürasyonu (dosyanın başında bir kez yapılır)
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

// Zod şeması (frontend'den gelen payload'u doğrulamak için)
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
  assignments: z.array(z.object({
    artistId: z.number().int("Sanatçı ID'si tam sayı olmalı."),
    role: z.nativeEnum(RoleInProject, { errorMap: () => ({ message: "Geçersiz rol."}) }),
    characterIds: z.array(z.number().int("Karakter ID'si tam sayı olmalı.")).optional(),
  })).optional(),
  categoryIds: z.array(z.number().int("Kategori ID'si tam sayı olmalı.")).optional(),
});

// Cloudinary'de eski resimleri arşivlemek için yardımcı fonksiyon
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
  { params }: { params: Promise<{ slug: string }> } // params'ı Promise olarak al
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params; // params'ı çöz
  const currentProjectSlug = resolvedParams.slug;

  if (!currentProjectSlug || typeof currentProjectSlug !== 'string' || currentProjectSlug.trim() === "") {
    return NextResponse.json({ message: 'Eksik veya geçersiz proje slug parametresi.' }, { status: 400 });
  }

  try {
    const currentProject = await prisma.project.findUnique({
      where: { slug: currentProjectSlug },
      select: { 
        id: true, title: true, slug: true, type: true, description: true, 
        coverImagePublicId: true, bannerImagePublicId: true, releaseDate: true, 
        isPublished: true, price: true, currency: true, externalWatchUrl: true,
      } 
    });

    if (!currentProject) {
      return NextResponse.json({ message: 'Güncellenecek proje bulunamadı.' }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = updateProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error("API Proje Güncelleme ([slug]/route.ts PUT) - Zod Hataları:", parsedBody.error.flatten().fieldErrors);
      return NextResponse.json({ message: "Geçersiz veri gönderildi.", errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { 
        assignments: newAssignmentsDataFromClient, 
        categoryIds: newCategoryIdsFromClient,
        coverImagePublicId: newCoverIdFromClient, 
        bannerImagePublicId: newBannerIdFromClient,
        externalWatchUrl: newExternalWatchUrlFromClient,
        price: newPriceFromClient,
        currency: newCurrencyFromClient,
        ...projectBasicDataFromClient 
    } = parsedBody.data;
    
    const projectUpdatePayload: Prisma.ProjectUpdateInput = {};
    let hasBasicChanges = false; // Sadece temel proje bilgilerinde değişiklik olup olmadığını takip eder

    // Temel proje alanlarını kontrol et ve sadece değişmişse payload'a ekle
    if (projectBasicDataFromClient.title !== undefined && projectBasicDataFromClient.title !== currentProject.title) { projectUpdatePayload.title = projectBasicDataFromClient.title; hasBasicChanges = true; }
    if (projectBasicDataFromClient.slug !== undefined && projectBasicDataFromClient.slug !== currentProject.slug) {
        const existingSlug = await prisma.project.findFirst({ where: { slug: projectBasicDataFromClient.slug, NOT: { id: currentProject.id } }});
        if (existingSlug) return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.']}}, { status: 409 });
        projectUpdatePayload.slug = projectBasicDataFromClient.slug; hasBasicChanges = true;
    }
    if (projectBasicDataFromClient.type !== undefined && projectBasicDataFromClient.type !== currentProject.type) { projectUpdatePayload.type = projectBasicDataFromClient.type; hasBasicChanges = true; }
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'description') && projectBasicDataFromClient.description !== (currentProject.description || null)) { projectUpdatePayload.description = projectBasicDataFromClient.description; hasBasicChanges = true; }
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'releaseDate')) {
        const newDate = projectBasicDataFromClient.releaseDate ? new Date(projectBasicDataFromClient.releaseDate) : null;
        const currentDate = currentProject.releaseDate ? new Date(currentProject.releaseDate) : null;
        if (newDate?.toISOString() !== currentDate?.toISOString()) { projectUpdatePayload.releaseDate = newDate; hasBasicChanges = true; }
    }
    if (projectBasicDataFromClient.isPublished !== undefined && projectBasicDataFromClient.isPublished !== currentProject.isPublished) { projectUpdatePayload.isPublished = projectBasicDataFromClient.isPublished; hasBasicChanges = true; }

    // Resimleri kontrol et
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'coverImagePublicId') && newCoverIdFromClient !== currentProject.coverImagePublicId) {
        projectUpdatePayload.coverImagePublicId = newCoverIdFromClient; hasBasicChanges = true;
        if (currentProject.coverImagePublicId) {
            const archiveId = getArchivePublicId(currentProject.coverImagePublicId, 'proje_kapak_arsiv');
            if (archiveId) cloudinary.uploader.rename(currentProject.coverImagePublicId, archiveId, { resource_type: 'image', overwrite: true }).catch(err => console.error("Eski kapak resmi arşivleme hatası:", err.message));
        }
    }
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'bannerImagePublicId') && newBannerIdFromClient !== currentProject.bannerImagePublicId) {
        projectUpdatePayload.bannerImagePublicId = newBannerIdFromClient; hasBasicChanges = true;
        if (currentProject.bannerImagePublicId) {
            const archiveId = getArchivePublicId(currentProject.bannerImagePublicId, 'proje_banner_arsiv');
            if (archiveId) cloudinary.uploader.rename(currentProject.bannerImagePublicId, archiveId, { resource_type: 'image', overwrite: true }).catch(err => console.error("Eski banner resmi arşivleme hatası:", err.message));
        }
    }

    // Proje tipine göre fiyat, para birimi ve izleme linki alanlarını ayarla
    const finalProjectType = projectUpdatePayload.type || currentProject.type;
    if (finalProjectType === 'anime') {
        if (currentProject.price !== null || currentProject.currency !== null || (Object.prototype.hasOwnProperty.call(parsedBody.data, 'externalWatchUrl') && newExternalWatchUrlFromClient !== (currentProject.externalWatchUrl || null))) hasBasicChanges = true;
        projectUpdatePayload.price = null; 
        projectUpdatePayload.currency = null;
        if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'externalWatchUrl')) projectUpdatePayload.externalWatchUrl = newExternalWatchUrlFromClient;
        else if (currentProject.externalWatchUrl !== null) projectUpdatePayload.externalWatchUrl = null; // Eğer gönderilmediyse ve eskiden varsa null yap
    } else if (finalProjectType === 'oyun') {
        if (currentProject.externalWatchUrl !== null) hasBasicChanges = true;
        projectUpdatePayload.externalWatchUrl = null;
        if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'price') && newPriceFromClient !== (currentProject.price || null)) { projectUpdatePayload.price = newPriceFromClient; hasBasicChanges = true; }
        if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'currency') && newCurrencyFromClient !== (currentProject.currency || null)) { projectUpdatePayload.currency = newCurrencyFromClient; hasBasicChanges = true; }
    }
    
    const finalUpdatedProject = await prisma.$transaction(async (tx) => {
      let projectEntityAfterUpdate = currentProject;
      if (hasBasicChanges || Object.keys(projectUpdatePayload).length > 0) {
        projectEntityAfterUpdate = await tx.project.update({
          where: { id: currentProject.id },
          data: projectUpdatePayload,
        });
      }

      if (newCategoryIdsFromClient !== undefined) {
        await tx.projectCategory.deleteMany({ where: { projectId: currentProject.id } });
        if (newCategoryIdsFromClient.length > 0) {
          await tx.projectCategory.createMany({
            data: newCategoryIdsFromClient.map((catId: number) => ({
              projectId: currentProject.id,
              categoryId: catId,
            }))
          });
        }
      }

      if (newAssignmentsDataFromClient !== undefined) {
        const oldAssignments = await tx.projectAssignment.findMany({
            where: { projectId: currentProject.id }, select: { id: true }
        });
        if (oldAssignments.length > 0) {
            await tx.voiceAssignment.deleteMany({
                where: { projectAssignmentId: { in: oldAssignments.map(a => a.id) } }
            });
        }
        await tx.projectAssignment.deleteMany({ where: { projectId: currentProject.id } });

        if (newAssignmentsDataFromClient.length > 0) {
          for (const assignmentData of newAssignmentsDataFromClient) {
            const createdPa = await tx.projectAssignment.create({
              data: {
                projectId: currentProject.id,
                artistId: assignmentData.artistId,
                role: assignmentData.role,
              },
            });
            if (assignmentData.role === RoleInProject.VOICE_ACTOR && assignmentData.characterIds && assignmentData.characterIds.length > 0) {
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
        where: { id: projectEntityAfterUpdate.id },
        include: { 
          assignments: { include: { artist: true, voiceRoles: { include: { character: true } } } },
          categories: { include: { category: true }},
        }
      });
    });

    return NextResponse.json(finalUpdatedProject, { status: 200 });

  } catch (error: any) {
    console.error(`API Proje PUT (slug: ${currentProjectSlug}) hatası:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta && typeof error.meta.target === 'string' && error.meta.target.includes('slug')) {
        return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.'] } }, { status: 409 });
      }
      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Güncellenecek proje veya ilişkili bir kayıt bulunamadı.' }, { status: 404 });
      }
    }
    return NextResponse.json({ message: error.message || 'Proje güncellenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}
// --- GET Metodu (Proje detaylarını admin için getirme) ---
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> } // Promise olarak al
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params; // params'ı çöz
  const projectSlug = resolvedParams.slug;

  if (!projectSlug) {
    return NextResponse.json({ message: 'Eksik proje slug parametresi.' }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug }, // projectSlug kullan
      include: {
        assignments: { 
            orderBy: [{ artist: {lastName: 'asc'}}, {artist: {firstName: 'asc'}}],
            include: { 
                artist: { select: { id: true, firstName: true, lastName: true } },
                voiceRoles: { // Karakterleri de çekiyoruz
                    orderBy: {character: {name: 'asc'}},
                    select: { character: { select: { id: true, name: true } } }
                }
            } 
        },
        categories: { 
            orderBy: {category: {name: 'asc'}},
            select: { category: {select: { id:true, name: true}}}
        },
        // ProjectImage gibi diğer ilişkiler de buraya eklenebilir
      }
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
  { params }: { params: Promise<{ slug: string }> } // Promise olarak al
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params; // params'ı çöz
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


