// src/app/api/admin/projects/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { RoleInProject, Prisma } from '@prisma/client'; // Prisma tiplerini import et
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface RouteContext {
  params: {
    slug: string;
  };
}

const updateProjectSchema = z.object({
  title: z.string().min(1, "Başlık boş olamaz").max(191, "Başlık çok uzun.").optional(),
  slug: z.string().min(1, "Slug boş olamaz.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug sadece küçük harf, rakam ve tire içerebilir.").max(191, "Slug çok uzun.").optional(),
  type: z.enum(['game', 'anime'], { message: "Tür 'game' veya 'anime' olmalıdır."}).optional(),
  description: z.string().max(5000, "Açıklama çok uzun.").nullable().optional(),
  coverImagePublicId: z.string().max(255, "Resim ID'si çok uzun.").nullable().optional(),
  releaseDate: z.coerce.date({errorMap: () => ({ message: 'Geçersiz yayın tarihi formatı.' })}).optional(),
  isPublished: z.boolean().optional(),
  assignments: z.array(z.object({
    artistId: z.number().int({ message: "Sanatçı ID'si bir sayı olmalı." }),
    role: z.nativeEnum(RoleInProject, { message: "Geçersiz rol." })
  })).optional(),
});

const getArchivePublicId = (oldPublicId: string, typePrefix: string) => {
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
    // Arşivlenmiş ID: kullanilmayanlar/orijinal_klasor_yolu/tipPrefix_orijinalDosyaAdi_timestamp
    return `${baseArchiveFolder}/${originalFolderPath}${typePrefix}_${filenamePart}_${Date.now()}`.substring(0, 200);
};


// --- GET (Tek bir projeyi detaylarıyla getir) ---
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


// --- PUT (Projeyi güncelle) ---
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  try {
    const currentProject = await prisma.project.findUnique({
      where: { slug: params.slug },
      // Karşılaştırma için tüm temel alanları ve eski public ID'yi al
      select: { 
        id: true, 
        title: true,
        slug: true,
        type: true,
        description: true,
        coverImagePublicId: true, 
        releaseDate: true,
        isPublished: true,
      } 
    });

    if (!currentProject) {
      return NextResponse.json({ message: 'Güncellenecek proje bulunamadı' }, { status: 404 });
    }

    const body = await request.json();
    const parsedBody = updateProjectSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: "Geçersiz veri.", errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { assignments, coverImagePublicId: newCoverImagePublicId, ...projectBasicData } = parsedBody.data;
    
    const projectUpdateData: Prisma.ProjectUpdateInput = {};
    let hasProjectDetailChanges = false;

    if (projectBasicData.title !== undefined && projectBasicData.title !== currentProject.title) { 
        projectUpdateData.title = projectBasicData.title; hasProjectDetailChanges = true; 
    }
    if (projectBasicData.slug !== undefined && projectBasicData.slug !== currentProject.slug) {
        const existingSlug = await prisma.project.findUnique({ where: { slug: projectBasicData.slug }});
        if (existingSlug && existingSlug.id !== currentProject.id) {
            return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.']}}, { status: 409 });
        }
        projectUpdateData.slug = projectBasicData.slug; hasProjectDetailChanges = true;
    }
    if (projectBasicData.type !== undefined && projectBasicData.type !== currentProject.type) { 
        projectUpdateData.type = projectBasicData.type; hasProjectDetailChanges = true; 
    }
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'description')) { 
        if (projectBasicData.description !== (currentProject.description || null)) {
            projectUpdateData.description = projectBasicData.description; hasProjectDetailChanges = true; 
        }
    }
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'releaseDate')) { 
        const newDate = projectBasicData.releaseDate ? new Date(projectBasicData.releaseDate).toISOString() : null;
        const currentDate = currentProject.releaseDate ? new Date(currentProject.releaseDate).toISOString() : null;
        if (newDate !== currentDate) {
            projectUpdateData.releaseDate = projectBasicData.releaseDate; hasProjectDetailChanges = true; 
        }
    }
    if (projectBasicData.isPublished !== undefined && projectBasicData.isPublished !== currentProject.isPublished) { 
        projectUpdateData.isPublished = projectBasicData.isPublished; hasProjectDetailChanges = true; 
    }

    const oldCoverImagePublicId = currentProject.coverImagePublicId;
    if (Object.prototype.hasOwnProperty.call(parsedBody.data, 'coverImagePublicId')) {
        if (newCoverImagePublicId !== oldCoverImagePublicId) {
            projectUpdateData.coverImagePublicId = newCoverImagePublicId;
            hasProjectDetailChanges = true;
            if (oldCoverImagePublicId) {
                const archivePublicId = getArchivePublicId(oldCoverImagePublicId, 'projeler');
                if (archivePublicId) {
                    try {
                        await cloudinary.uploader.rename(oldCoverImagePublicId, archivePublicId, { resource_type: 'image', overwrite: false });
                        console.log(`Eski proje resmi arşivlendi: ${oldCoverImagePublicId} -> ${archivePublicId}`);
                    } catch (renameError: any) { /* ... (hata loglama) ... */ }
                }
            }
        }
    }
    
    let assignmentsHaveChanged = false;
    if (assignments !== undefined) {
        const currentDbAssignments = await prisma.projectAssignment.findMany({
            where: { projectId: currentProject.id },
            select: { artistId: true, role: true },
            orderBy: [{artistId: 'asc'}, {role: 'asc'}] // Sıralama önemli
        });
        const newClientAssignments = assignments
            .map(a => ({ artistId: a.artistId, role: a.role }))
            .sort((a,b) => a.artistId - b.artistId || a.role.localeCompare(b.role)); // Sıralama önemli

        if (JSON.stringify(currentDbAssignments) !== JSON.stringify(newClientAssignments)) {
            assignmentsHaveChanged = true;
        }
    }
    
    if (!hasProjectDetailChanges && !assignmentsHaveChanged) {
      return NextResponse.json(currentProject, { status: 200 }); 
    }

    const updatedProjectResult = await prisma.$transaction(async (tx) => {
      let finalProjectDetails;
      if (hasProjectDetailChanges) {
        finalProjectDetails = await tx.project.update({
          where: { id: currentProject.id }, 
          data: projectUpdateData,
        });
      } else {
        finalProjectDetails = await tx.project.findUniqueOrThrow({ where: { id: currentProject.id } });
      }

      if (assignmentsHaveChanged && assignments !== undefined) {
        await tx.projectAssignment.deleteMany({ where: { projectId: currentProject.id } });
        if (assignments.length > 0) {
          await tx.projectAssignment.createMany({
            data: assignments.map(assignment => ({
              projectId: currentProject.id, 
              artistId: assignment.artistId,
              role: assignment.role, 
            })),
          });
        }
      }
      // Güncellenmiş projeyi atamalarıyla birlikte döndür
      return await tx.project.findUniqueOrThrow({
        where: { id: finalProjectDetails.id },
        include: { assignments: { select: { artistId: true, role: true }}}
      });
    });

    return NextResponse.json(updatedProjectResult, { status: 200 });
  } catch (error: any) {
    console.error(`Proje (slug: ${params.slug}) güncelleme hatası:`, error);
    if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
        return NextResponse.json({ errors: { slug: ['Bu slug zaten kullanılıyor.'] } }, { status: 409 });
    }
    if (error?.code === 'P2025') {
         return NextResponse.json({ message: 'Güncellenecek proje bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Proje güncellenirken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}


// --- DELETE (Projeyi sil) ---
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