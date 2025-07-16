//src/app/api/tasks/[taskId]/comments/route.ts
// src/app/api/tasks/[taskId]/comments/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const createCommentSchema = z.object({
  content: z.string().min(1, "Yorum boş olamaz.").max(1000),
});

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const taskId = parseInt(params.taskId, 10);
    if (!session?.user?.id || isNaN(taskId)) {
      return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
    }
    const authorId = parseInt(session.user.id);
    
    // TODO: Yetki kontrolü (kullanıcı bu projenin üyesi mi?)
    
    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify({ message: "Geçersiz veri" }), { status: 400 });
    }
    
    // === ÇÖZÜM BURADA: Sadece ID'leri veriyoruz ===
    const newComment = await prisma.comment.create({
      data: {
        content: validation.data.content,
        authorId: authorId,      // Yorumu yapan kullanıcının ID'si
        targetType: 'TASK',      // Yorumun tipi
        targetId: taskId,        // Yorumun hedef ID'si (yani task'ın ID'si)
      },
      include: {
        author: { select: { username: true, profileImage: true } }
      }
    });
    
    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    console.error("[TASK_COMMENT_POST_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}
