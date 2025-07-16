//src/app/api/translation-lines/[lineId]/comments/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const createLineCommentSchema = z.object({
  content: z.string().min(1, "Yorum boş olamaz.").max(500),
});

// --- YORUMLARI LİSTELEME ---
export async function GET(
    request: Request,
    { params }: { params: { lineId: string } }
) {
    try {
        const lineId = parseInt(params.lineId, 10);
        // TODO: Yetki kontrolü
        
        const comments = await prisma.comment.findMany({
            where: {
                targetType: 'TRANSLATION_LINE',
                targetId: lineId,
            },
            include: {
                author: { select: { username: true, profileImage: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("[GET_LINE_COMMENTS_ERROR]", error);
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}

export async function POST(
  request: Request,
  { params }: { params: { lineId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const lineId = parseInt(params.lineId, 10);
    if (!session?.user?.id || isNaN(lineId)) {
      return new NextResponse('Yetkisiz', { status: 401 });
    }
    const authorId = parseInt(session.user.id);
    
    // TODO: Yetki Kontrolü - Kullanıcı bu projenin üyesi mi?

    const body = await request.json();
    const validation = createLineCommentSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse('Geçersiz veri', { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content: validation.data.content,
        authorId: authorId,
        // DİKKAT: targetType'ı bu sefer 'TRANSLATION_LINE' yapıyoruz
        targetType: 'TRANSLATION_LINE', 
        targetId: lineId,
      },
      include: {
        author: { select: { username: true, profileImage: true } }
      }
    });

    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error("[LINE_COMMENT_POST_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}