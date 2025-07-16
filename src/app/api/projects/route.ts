// src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ContentType, ProjectStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

// --- PROJELERİ LİSTELEME (Footer ve diğer sayfalar için) ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '5', 10);
  const orderBy = searchParams.get('orderBy') || 'createdAt'; // Sıralama parametresi

  let contentType: ContentType | undefined;
  if (typeParam === 'oyun') contentType = ContentType.GAME;
  if (typeParam === 'anime') contentType = ContentType.ANIME;

  try {
    const projects = await prisma.project.findMany({
      where: {
        isPublic: true,
        content: {
          type: contentType,
        },
      },
      take: limit,
      orderBy: {
        [orderBy]: 'desc', // Gelen parametreye göre sırala
      },
      include: {
        content: true,
        team: { select: { name: true, slug: true } },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("API /api/projects GET Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


// --- YENİ PROJE OLUŞTURMA ---
const createProjectSchema = z.object({
  teamId: z.number().int().positive("Geçerli bir ekip ID'si gereklidir."),
  contentId: z.number().int().positive("Geçerli bir içerik ID'si gereklidir."),
  name: z.string().min(5, "Proje adı en az 5 karakter olmalıdır.").max(100, "Proje adı en fazla 100 karakter olabilir."),
});

export async function POST(request: Request) {
  try {
    // 1. Oturum ve Yetki Kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz işlem', { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    
    // 2. Gelen Veriyi Al ve Doğrula
    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);
    if (!validation.success) {
      // Zod hatalarını daha anlaşılır bir formatta geri döndür
      const errorMessages = validation.error.flatten().fieldErrors;
      return new NextResponse(JSON.stringify({ message: "Geçersiz veri", errors: errorMessages }), { status: 400 });
    }
    const { teamId, contentId, name } = validation.data;

    // 3. Bu işlemi yapan kişi, seçilen ekibin Lideri mi?
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership || membership.role !== 'LEADER') {
      return new NextResponse(JSON.stringify({ message: 'Sadece ekip liderleri yeni proje başlatabilir.' }), { status: 403 });
    }
    
    // 4. Bu content için zaten bir proje var mı?
    const existingProject = await prisma.project.findFirst({
      where: { contentId: contentId },
    });
    if (existingProject) {
      return new NextResponse(JSON.stringify({ message: 'Bu içerik için zaten bir proje başlatılmış.' }), { status: 409 });
    }

    // 5. Yeni projeyi oluştur
    const newProject = await prisma.project.create({
      data: {
        name,
        teamId,
        contentId,
        status: ProjectStatus.RECRUITING, // Projeler varsayılan olarak ekip toplama aşamasında başlar
        isPublic: true,
      },
    });

    return NextResponse.json(newProject, { status: 201 });

  } catch (error) {
    console.error("[PROJECTS_POST_ERROR]", error);
    return new NextResponse(JSON.stringify({ message: 'Sunucu tarafında bir hata oluştu.' }), { status: 500 });
  }
}