// src/app/api/users/[userId]/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: { userId: string };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const userIdInt = parseInt(params.userId, 10); // Bu, profili görüntülenen kullanıcının ID'si
  if (isNaN(userIdInt)) {
    return NextResponse.json({ error: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const skip = (page - 1) * limit;

  console.log(`API /api/users/${userIdInt}/activity (comments for user) GET request received`);

  try {
    const comments = await prisma.comment.findMany({
      where: { userId: userIdInt }, // Bu kullanıcının yaptığı yorumları getir
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
      select: {
        id: true,
        content: true,
        createdAt: true,
        project: { // Yorumun yapıldığı proje
          select: { 
            title: true, 
            slug: true, 
            type: true, 
            coverImagePublicId: true, // Projenin küçük resmi için
            // bannerImagePublicId: true, // Banner'a gerek yok, cover yeterli
          } 
        },
        user: { // YORUMU YAPAN KULLANICININ BİLGİLERİ
          select: {
            id: true, // Gerekirse
            username: true,
            profileImagePublicId: true,
          }
        }
      }
    });

    // Veri yapısı UserCommentActivity ile uyumlu olmalı
    const userActivities = comments.map(comment => ({
      type: 'comment' as const,
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      project: {
        ...comment.project,
        // API'den null gelebilecek alanlar için varsayılan atama
        coverImagePublicId: comment.project.coverImagePublicId || null, 
        bannerImagePublicId: null, // Artık banner çekmiyoruz, ama tipte varsa null atayalım
      },
      user: { // Yorumu yapan kullanıcı bilgisi
        id: comment.user.id,
        username: comment.user.username,
        profileImagePublicId: comment.user.profileImagePublicId || null,
      }
    }));

    return NextResponse.json(userActivities);

  } catch (error) {
    console.error(`API Error for user ${userIdInt} activity (comments):`, error);
    return NextResponse.json({ error: "Kullanıcı yorumları getirilirken bir hata oluştu." }, { status: 500 });
  }
}