// src/app/api/tasks/[taskId]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod'; // z'nin import edildiğinden emin ol

// --- GET FONKSİYONU ---
export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const taskId = parseInt(params.taskId, 10);
        
        if (!session?.user?.id || isNaN(taskId)) {
            return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
        }
        const userId = parseInt(session.user.id);

// === ÇÖZÜM BURADA: Veriyi iki ayrı sorguyla çekiyoruz ===

        // 1. Görevin kendisini ve atananlarını çek
        const taskPromise = prisma.task.findUnique({
            where: { id: taskId },
            include: {
                assignees: { include: { user: { select: { id: true, username: true, profileImage: true } } } },
            }
        });

        // 2. Bu göreve ait yorumları Ayrı bir sorguyla çek
        const commentsPromise = prisma.comment.findMany({
            where: {
                targetType: 'TASK',
                targetId: taskId,
            },
            include: {
                author: { select: { username: true, profileImage: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // İki sorguyu paralel olarak çalıştır
        const [task, comments] = await Promise.all([taskPromise, commentsPromise]);

        if (!task) {
            return new NextResponse('Görev bulunamadı', { status: 404 });
        }
        
        // İki sonucu birleştirip tek bir obje olarak geri döndür
        const responseData = { ...task, comments };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`[GET_TASK_DETAILS_ERROR]`, error);
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}
// === ÇÖZÜM BURADA: EKSİK OLAN ŞEMAYI TEKRAR EKLİYORUZ ===
const updateTaskDetailsSchema = z.object({
    title: z.string().min(3, "Başlık en az 3 karakter olmalıdır.").optional(),
    description: z.string().max(1000, "Açıklama 1000 karakteri geçemez.").nullable().optional(),
});
// =======================================================


// --- PUT FONKSİYONU ---
export async function PUT(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const taskId = parseInt(params.taskId, 10);
        if (!session?.user?.id || isNaN(taskId)) {
            return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
        }
        
        // TODO: Yetki kontrolü (sadece lider veya göreve atanan kişi düzenleyebilmeli)

        const body = await request.json();
        const validation = updateTaskDetailsSchema.safeParse(body);
        if(!validation.success) {
            return new NextResponse('Geçersiz veri', { status: 400 });
        }
        
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: validation.data,
            include: { // Güncellenmiş görevi tüm detaylarıyla geri döndür
                assignees: { include: { user: { select: { id: true, username: true, profileImage: true } } } },
            }
        });

        return NextResponse.json(updatedTask);

    } catch (error) {
        console.error(`[UPDATE_TASK_DETAILS_ERROR]`, error);
        return new NextResponse('Sunucu hatası', { status: 500 });
    }
}