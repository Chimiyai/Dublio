//src/app/api/translation-lines/[lineId]/comments/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// --- GET: Yorumları Listele ---
export async function GET(
    request: Request,
    { params }: { params: { lineId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }
    
    try {
        const lineId = parseInt(params.lineId, 10);

        // TODO: Kullanıcının bu projeyi görme yetkisi var mı kontrolü eklenebilir.

        const comments = await prisma.comment.findMany({
            where: {
                targetType: 'TRANSLATION_LINE', // Polimorfik tip
                targetId: lineId
            },
            include: {
                author: {
                    select: {
                        username: true,
                        profileImage: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        return NextResponse.json(comments);

    } catch (error) {
        console.error("[GET_LINE_COMMENTS_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}


// --- POST: Yeni Yorum Ekle ---
export async function POST(
    request: Request,
    { params }: { params: { lineId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse('Yetkisiz', { status: 401 });
    }

    try {
        const lineId = parseInt(params.lineId, 10);
        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ message: 'Yorum içeriği boş olamaz.' }, { status: 400 });
        }

        const newComment = await prisma.comment.create({
            data: {
                authorId: parseInt(session.user.id),
                content: content,
                targetType: 'TRANSLATION_LINE',
                targetId: lineId
            },
            include: {
                author: {
                    select: {
                        username: true,
                        profileImage: true
                    }
                }
            }
        });

        return NextResponse.json(newComment, { status: 201 });

    } catch (error) {
        console.error("[POST_LINE_COMMENT_ERROR]", error);
        return new NextResponse("Sunucu Hatası", { status: 500 });
    }
}