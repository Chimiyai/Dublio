// src/app/api/users/[userId]/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod'; // Zod importu eklendi

// Sayfalama ve filtreleme için query parametreleri şeması
const getActivityQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number), // Örneğin, varsayılan 10 aktivite
  // type: z.enum(['comment', 'like', 'favorite']).optional(), // Gelecekte farklı aktivite türleri için
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  const userIdString = resolvedParams.userId;

  if (!userIdString || typeof userIdString !== 'string' || userIdString.trim() === "") {
    return NextResponse.json({ message: 'Eksik veya geçersiz kullanıcı ID parametresi.' }, { status: 400 });
  }
  const userId = parseInt(userIdString, 10); // Değişken adı sadece 'userId'
  if (isNaN(userId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID formatı.' }, { status: 400 });
  }

  // Query parametrelerini al ve doğrula
  const { searchParams } = new URL(request.url);
  const queryParseResult = getActivityQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryParseResult.success) {
    return NextResponse.json({ message: 'Geçersiz sorgu parametreleri.', errors: queryParseResult.error.issues }, { status: 400 });
  }
  const { page, limit /*, type: activityType */ } = queryParseResult.data;
  const skip = (page - 1) * limit;
  
  try {
    // Şimdilik sadece yorumları alıyoruz
    const comments = await prisma.comment.findMany({
      where: { userId: userId }, // userId kullanıldı (userIdInt yerine)
      orderBy: { createdAt: 'desc' },
      take: limit, // query'den gelen limit kullanıldı
      skip: skip,  // query'den gelen skip kullanıldı
      select: {
        id: true,
        content: true,
        createdAt: true,
        project: {
          select: { 
            title: true, 
            slug: true, 
            type: true, 
            coverImagePublicId: true,
          } 
        },
        // Yorumu yapan kullanıcıyı tekrar çekmeye gerek yok, zaten userId'sini biliyoruz
        // Ama eğer farklı bir kullanıcı için aktivite çekiliyorsa user bilgisi lazım olabilir.
        // Bu endpoint /users/[userId]/activity olduğu için, bu userId'nin kendi aktiviteleri.
        // user: { 
        //   select: {
        //     id: true, 
        //     username: true,
        //     profileImagePublicId: true,
        //   }
        // }
      }
    });

    const totalComments = await prisma.comment.count({
        where: { userId: userId },
    });

    // UserCommentActivity tipine uygun map'leme
    // Bu tipin frontend'de tanımlı olduğunu varsayıyorum
    const userActivities = comments.map(comment => ({
      type: 'comment' as const, // Sabit tip
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      project: { // Proje bilgilerini doğru map'le
        title: comment.project.title,
        slug: comment.project.slug,
        type: comment.project.type, // Bu string ("oyun" | "anime")
        coverImagePublicId: comment.project.coverImagePublicId || null,
        // bannerImagePublicId: null, // Eğer bu alan UserCommentActivity'de yoksa veya opsiyonel ise
      },
      // Bu endpoint zaten belirli bir kullanıcının aktivitelerini getirdiği için
      // her aktiviteye user objesini eklemek gereksiz olabilir.
      // Eğer UserCommentActivity tipi user bekliyorsa, o zaman session'dan veya
      // veritabanından çekilen user bilgisi kullanılabilir.
      // user: {
      //   id: userId, // Zaten biliniyor
      //   username: sessionUser.username, // Session'dan veya DB'den
      //   profileImagePublicId: sessionUser.profileImagePublicId,
      // }
    }));

    return NextResponse.json({
        activities: userActivities,
        totalPages: Math.ceil(totalComments / limit),
        currentPage: page,
        totalItems: totalComments,
    });

  } catch (error) {
    console.error(`API Hatası: Kullanıcı ${userId} aktiviteleri (yorumlar) getirilirken:`, error);
    return NextResponse.json({ error: "Kullanıcı yorumları getirilirken bir hata oluştu." }, { status: 500 });
  }
}