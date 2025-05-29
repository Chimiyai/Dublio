// src/app/api/admin/projects/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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


interface RouteContext {
  params: {
    slug: string;
  };
}

// Zod şeması (frontend'den gelen payload'u doğrulamak için)
const updateProjectSchema = z.object({
  title: z.string().min(1, "Başlık gerekli.").max(191).optional(),
  slug: z.string().min(1, "Slug gerekli.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug geçersiz formatta.").max(191).optional(),
  type: z.enum(['oyun', 'anime'], { errorMap: () => ({ message: "Tür 'oyun' veya 'anime' olmalı."}) }).optional(),
  description: z.string().max(5000, "Açıklama en fazla 5000 karakter olabilir.").nullable().optional(),
  coverImagePublicId: z.string().max(255).nullable().optional(),
  bannerImagePublicId: z.string().max(255).nullable().optional(),
  releaseDate: z.coerce.date({ errorMap: () => ({ message: "Geçersiz tarih formatı."}) }).nullable().optional(),
  isPublished: z.boolean().optional(),
  price: z.number().min(0, "Fiyat negatif olamaz.").nullable().optional(),
  currency: z.string().length(3, "Para birimi 3 karakter olmalı.").nullable().optional(),
  assignments: z.array(z.object({
    artistId: z.number().int("Sanatçı ID'si tam sayı olmalı."),
    role: z.nativeEnum(RoleInProject, { errorMap: () => ({ message: "Geçersiz rol."}) }),
    characterIds: z.array(z.number().int("Karakter ID'si tam sayı olmalı.")).optional(), // VOICE_ACTOR için
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
        if (parts.length > 0) {
            originalFolderPath = parts.join('/') + '/';
        }
    }
    const newPublicId = `${baseArchiveFolder}/${originalFolderPath}${typePrefix}_${filenamePart}_${Date.now()}`;
    return newPublicId.substring(0, 200);
};

// --- PUT (Projeyi güncelle) ---
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const currentSlug = params.slug;

  try {
    const currentProject = await prisma.project.findUnique({
      where: { slug: currentSlug },
      select: { 
        id: true, 
        title: true,
        slug: true,
        type: true,
        description: true,
        coverImagePublicId: true, 
        bannerImagePublicId: true,
        releaseDate: true,
        isPublished: true,
        price: true,
        currency: true,
      } 
    });

    if (!currentProject) {
      return NextResponse.json({ message: 'Güncellenecek proje bulunamadı.' }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = updateProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error("API Proje Güncelleme - Zod Hataları:", parsedBody.error.flatten().fieldErrors);
      return NextResponse.json({ message: "Geçersiz veri gönderildi.", errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { 
        assignments: newAssignmentsData, 
        categoryIds: newCategoryIds,
        coverImagePublicId: newCoverImagePublicIdFromClient, 
        bannerImagePublicId: newBannerImagePublicIdFromClient,
        ...projectBasicData 
    } = parsedBody.data;
    
    const projectUpdateInput: Prisma.ProjectUpdateInput = {};

    // Temel proje alanlarını güncelleme (sadece değişmişse)
    if (projectBasicData.title !== undefined && projectBasicData.title !== currentProject.title) projectUpdateInput.title = projectBasicData.title;
    if (projectBasicData.slug !== undefined && projectBasicData.slug !== currentProject.slug) {
        const existingSlugProject = await prisma.project.findUnique({ where: { slug: projectBasicData.slug }});
        if (existingSlugProject && existingSlugProject.id !== currentProject.id) {
            return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.']}}, { status: 409 });
        }
        projectUpdateInput.slug = projectBasicData.slug;
    }
    if (projectBasicData.type !== undefined && projectBasicData.type !== currentProject.type) projectUpdateInput.type = projectBasicData.type;
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'description')) {
        if (projectBasicData.description !== (currentProject.description || null)) projectUpdateInput.description = projectBasicData.description;
    }
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'releaseDate')) {
        const newDateISO = projectBasicData.releaseDate ? new Date(projectBasicData.releaseDate).toISOString() : null;
        const currentDateISO = currentProject.releaseDate ? new Date(currentProject.releaseDate).toISOString() : null;
        if (newDateISO !== currentDateISO) projectUpdateInput.releaseDate = projectBasicData.releaseDate;
    }
    if (projectBasicData.isPublished !== undefined && projectBasicData.isPublished !== currentProject.isPublished) projectUpdateInput.isPublished = projectBasicData.isPublished;

    // Resim yönetimi
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'coverImagePublicId')) {
        if (newCoverImagePublicIdFromClient !== currentProject.coverImagePublicId) {
            projectUpdateInput.coverImagePublicId = newCoverImagePublicIdFromClient;
            if (currentProject.coverImagePublicId) {
                const archiveId = getArchivePublicId(currentProject.coverImagePublicId, 'proje_kapak');
                if (archiveId) {
                    cloudinary.uploader.rename(currentProject.coverImagePublicId, archiveId, { resource_type: 'image', overwrite: true })
                        .catch(err => console.error("Eski kapak resmi arşivleme hatası:", err.message));
                }
            }
        }
    }
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'bannerImagePublicId')) {
        if (newBannerImagePublicIdFromClient !== currentProject.bannerImagePublicId) {
            projectUpdateInput.bannerImagePublicId = newBannerImagePublicIdFromClient;
            if (currentProject.bannerImagePublicId) {
                const archiveId = getArchivePublicId(currentProject.bannerImagePublicId, 'proje_banner');
                if (archiveId) {
                    cloudinary.uploader.rename(currentProject.bannerImagePublicId, archiveId, { resource_type: 'image', overwrite: true })
                        .catch(err => console.error("Eski banner resmi arşivleme hatası:", err.message));
                }
            }
        }
    }
    
    // Fiyat ve para birimi (sadece oyunlar için veya tip oyuna çevriliyorsa)
    const finalType = projectUpdateInput.type || currentProject.type;
    if (finalType === 'oyun') {
        if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'price')) {
            if (projectBasicData.price !== (currentProject.price || null)) projectUpdateInput.price = projectBasicData.price;
        }
        if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'currency')) {
             if (projectBasicData.currency !== (currentProject.currency || null)) projectUpdateInput.currency = projectBasicData.currency;
        }
    } else if (finalType === 'anime') { // Eğer tip anime ise veya anime'ye çevriliyorsa fiyatı sıfırla
        projectUpdateInput.price = null;
        projectUpdateInput.currency = null;
    }

    // Transaction ile tüm güncellemeleri yap
    const updatedProject = await prisma.$transaction(async (tx) => {
      // 1. Proje temel bilgilerini güncelle
      const projectAfterBasicUpdate = Object.keys(projectUpdateInput).length > 0
        ? await tx.project.update({
            where: { id: currentProject.id }, 
            data: projectUpdateInput,
          })
        : currentProject; // Eğer temel bilgi değişikliği yoksa mevcut projeyi kullan

      // 2. Kategori Atamalarını Yönet
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

      // 3. Sanatçı Atamalarını (ProjectAssignment) ve Seslendirme Rollerini (VoiceAssignment) Yönet
      if (newAssignmentsData !== undefined) {
        // Önce mevcut tüm VoiceAssignment'ları SİL (bu projedeki TÜM atamalar için)
        const existingOldAssignments = await tx.projectAssignment.findMany({
          where: { projectId: currentProject.id },
          select: { id: true }
        });
        if (existingOldAssignments.length > 0) {
          await tx.voiceAssignment.deleteMany({
            where: { projectAssignmentId: { in: existingOldAssignments.map(a => a.id) } }
          });
        }

        // Sonra mevcut TÜM ProjectAssignment'ları SİL
        await tx.projectAssignment.deleteMany({ where: { projectId: currentProject.id } });

        // Yeni ProjectAssignment'ları ve ilişkili VoiceAssignment'ları EKLE
        if (newAssignmentsData.length > 0) {
          for (const assignmentData of newAssignmentsData) {
            // Yeni ProjectAssignment oluştur
            const createdPa = await tx.projectAssignment.create({
              data: {
                projectId: currentProject.id, 
                artistId: assignmentData.artistId,
                role: assignmentData.role, 
              },
            });

            // Eğer rol VOICE_ACTOR ise ve characterIds varsa, VoiceAssignment kayıtlarını oluştur
            if (assignmentData.role === RoleInProject.VOICE_ACTOR && assignmentData.characterIds && assignmentData.characterIds.length > 0) {
              // Karakterlerin geçerliliğini kontrol et (opsiyonel ama önerilir)
              const validChars = await tx.projectCharacter.findMany({
                  where: { id: { in: assignmentData.characterIds }, projectId: currentProject.id },
                  select: { id: true }
              });
              const validCharIds = validChars.map(vc => vc.id);

              if (validCharIds.length > 0) {
                const vaData = validCharIds.map(charId => ({
                  projectAssignmentId: createdPa.id,
                  projectCharacterId: charId,
                }));
                await tx.voiceAssignment.createMany({ data: vaData });
              }
            }
          }
        }
      }

      // Son olarak, güncellenmiş projeyi tüm ilişkileriyle döndür
      return await tx.project.findUniqueOrThrow({
        where: { id: projectAfterBasicUpdate.id },
        include: { 
          assignments: {
            orderBy: { artist: { lastName: 'asc' } },
            include: {
              artist: { select: { id: true, firstName: true, lastName: true } },
              voiceRoles: {
                orderBy: { character: { name: 'asc' } },
                include: {
                  character: { select: { id: true, name: true } }
                }
              }
            }
          },
          categories: { 
            orderBy: { category: { name: 'asc' } },
            select: { category: {select: { id:true, name: true}}}
          },
        }
      });
    });

    return NextResponse.json(updatedProject, { status: 200 });

  } catch (error: any) {
    console.error(`API Proje (slug: ${currentSlug}) güncelleme hatası:`, error);
    if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
        return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.'] } }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Prisma'nın kendi hata tipini kullan
         return NextResponse.json({ message: 'İşlem yapılacak proje veya ilişkili kayıt bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ message: error.message || 'Proje güncellenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}


// --- GET ve DELETE metodları (mevcut kodundaki gibi kalabilir) ---
// GET Metodu
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      include: { 
        assignments: {
          select: {
            artistId: true,
            role: true,
            artist: { 
                select: { id: true, firstName: true, lastName: true, imagePublicId: true }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ message: "Proje bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error(`Proje (slug: ${params.slug}) getirilirken hata:`, error);
    return NextResponse.json({ message: "Proje getirilirken bir sunucu hatası oluştu." }, { status: 500 });
  }
}

// DELETE Metodu
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }
  const slugToDelete = params.slug;

  try {
    // Önce projeyi bulup public ID'sini alalım
    const projectToDelete = await prisma.project.findUnique({
      where: { slug: slugToDelete },
      select: { id: true, title: true, coverImagePublicId: true } // title'ı da seçiyoruz
    });

    if (!projectToDelete) { // Önce null kontrolü
      return NextResponse.json({ message: 'Silinecek proje bulunamadı.' }, { status: 404 });
    }
    
    // Veritabanından silme işlemi (onDelete: Cascade ile atamalar da silinecek)
    await prisma.project.delete({
      where: { slug: slugToDelete },
    });
    
    // Veritabanından silme başarılı olduktan sonra Cloudinary'den resmi arşivle/sil
    if (projectToDelete.coverImagePublicId) {
      const archivePublicId = getArchivePublicId(projectToDelete.coverImagePublicId, 'projeler_silinen');
      if (archivePublicId) {
        try {
          console.log(`Cloudinary'de arşivleniyor (proje DELETE): ${projectToDelete.coverImagePublicId} -> ${archivePublicId}`);
          await cloudinary.uploader.rename(projectToDelete.coverImagePublicId, archivePublicId, { resource_type: 'image', overwrite: false });
        } catch (renameError: any) {
          if (renameError.http_code === 404 && renameError.message?.includes("Resource not found")) {
            console.log(`Arşivlenecek proje resmi Cloudinary'de bulunamadı (DELETE): ${projectToDelete.coverImagePublicId}`);
          } else {
            console.error("Cloudinary proje resmi arşivleme hatası (DELETE):", renameError);
            // Bu hatanın ana işlemi etkilememesi için burada devam edebiliriz, 
            // çünkü DB'den silme başarılı oldu. Sadece loglayıp geçebiliriz.
          }
        }
      }
    }

    return NextResponse.json({ message: `"${projectToDelete.title}" başlıklı proje başarıyla silindi.` });
  } catch (error: any) {
    console.error(`Proje (slug: ${slugToDelete}) silme hatası:`, error);
    if (error.code === 'P2025') { // Bu, findUnique'ta değil de delete'te çıkarsa diye
      return NextResponse.json({ message: 'Silinecek proje bulunamadı (delete sırasında).' }, { status: 404 });
    }
    // P2003: Foreign key constraint failed on the field: `ProjectAssignment_projectId_fkey (index)`
    // Eğer onDelete: Cascade düzgün çalışmazsa veya başka bir tablo projeye bağlıysa bu hata alınabilir.
    if (error.code === 'P2003') { 
        return NextResponse.json({ message: 'Bu proje başka verilerle ilişkili olduğu için silinemedi. Lütfen önce ilişkili verileri silin.'}, {status: 409});
    }
    return NextResponse.json({ message: 'Proje silinirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}