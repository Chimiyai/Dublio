// src/app/api/projects/[projectId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

const createCommentSchema = z.object({
  content: z.string().min(3, 'Yorum en az 3 karakter olmalı.').max(1000, 'Yorum en fazla 1000 karakter olabilir.'),
});

const getCommentsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  // sortBy: z.enum(['createdAt_asc', 'createdAt_desc']).optional().default('createdAt_desc'), // İleride eklenebilir
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = await params;
  const projectIdString = resolvedParams.projectId;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yorum yapmak için giriş yapmalısınız.' }, { status: 401 });
  }
  if (!projectIdString || typeof projectIdString !== 'string') { // projectIdString'i kontrol et
      return NextResponse.json({ message: 'Eksik veya geçersiz proje ID parametresi.' }, { status: 400 });
  }
  const projectId = parseInt(projectIdString, 10);
  if (isNaN(projectId)) {
    return NextResponse.json({ message: 'Geçersiz proje ID formatı.' }, { status: 400 });
  }
  const userId = parseInt(session.user.id);

  try {
    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Geçersiz yorum verisi.', errors: validation.error.issues }, { status: 400 });
    }

    const { content } = validation.data;

    // Projenin var olup olmadığını kontrol et (opsiyonel ama iyi bir pratik)
    const projectExists = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectExists) {
      return NextResponse.json({ message: 'Yorum yapılacak proje bulunamadı.' }, { status: 404 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        projectId: projectId,
        userId,
      },
      include: { // Yeni yorumu, kullanıcı bilgileriyle birlikte döndür
        user: {
          select: {
            id: true,
            username: true,
            profileImagePublicId: true,
            role: true,
          },
        },
      },
    });

    // TODO: Belki proje için yorum sayısını artır (denormalizasyon)
    // await prisma.project.update({ where: { id: projectId }, data: { commentCount: { increment: 1 } } });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    return NextResponse.json({ message: 'Yorum eklenirken bir hata oluştu.' }, { status: 500 });
  }
}


export async function GET(
    request: NextRequest, 
    { params }: { params: Promise<{ projectId: string }> } // 1. Parametre tipi doğru
) {
  const resolvedParams = await params; // 2. Promise'ı çöz
  const projectIdString = resolvedParams.projectId;
  if (!projectIdString || typeof projectIdString !== 'string') {
      return NextResponse.json({ message: 'Eksik veya geçersiz proje ID parametresi.' }, { status: 400 });
  }
  const projectId = parseInt(projectIdString, 10); // Parse et
  if (isNaN(projectId)) { // Şimdi isNaN kontrolü yap
    return NextResponse.json({ message: 'Geçersiz proje ID formatı.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const queryParseResult = getCommentsQuerySchema.safeParse(Object.fromEntries(searchParams)); // queryParse -> queryParseResult
  if (!queryParseResult.success) {
    return NextResponse.json({ message: 'Geçersiz sorgu parametreleri.', errors: queryParseResult.error.issues }, { status: 400 });
  }
  const { page, limit } = queryParseResult.data;
  const skip = (page - 1) * limit;

  try {
    const comments = await prisma.comment.findMany({
      where: { projectId: projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImagePublicId: true,
            role: true, // Admin veya yorum sahibi silme yetkisi için
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalComments = await prisma.comment.count({
      where: { projectId: projectId },
    });

    return NextResponse.json({
      comments,
      totalPages: Math.ceil(totalComments / limit),
      currentPage: page,
      totalComments,
    });
  } catch (error) {
    console.error('Yorumları getirme hatası:', error);
    return NextResponse.json({ message: 'Yorumlar getirilirken bir hata oluştu.' }, { status: 500 });
  }
}