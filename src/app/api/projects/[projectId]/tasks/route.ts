// src/app/api/projects/[projectId]/tasks/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { TaskStatus, TaskType } from '@prisma/client';
import { z } from 'zod';

// --- PROJEYE AİT GÖREVLERİ LİSTELEME ---
export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const projectId = parseInt(params.projectId, 10);
        if (!session?.user?.id || isNaN(projectId)) {
            return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
        }
        
        const tasks = await prisma.task.findMany({
            where: { projectId: projectId },
            include: { assignees: { include: { user: { select: { username: true, profileImage: true } } } } },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("[GET_TASKS_ERROR]", error);
        return new NextResponse('Sunucu Hatası', { status: 500 });
    }
}


// --- YENİ BİR GÖREV OLUŞTURMA ---
const createTaskSchema = z.object({
    title: z.string().min(3, "Başlık en az 3 karakter olmalıdır."),
    type: z.nativeEnum(TaskType),
    assigneeIds: z.array(z.number().int()).optional(),
});

export async function POST(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const projectId = parseInt(params.projectId, 10);
        if (!session?.user?.id || isNaN(projectId)) {
            return new NextResponse('Yetkisiz veya geçersiz istek', { status: 401 });
        }
        const userId = parseInt(session.user.id);
        
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { teamId: true }
        });
        if (!project) {
            return new NextResponse('Proje bulunamadı', { status: 404 });
        }
        
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId: project.teamId, userId: userId } }
        });
        if (!membership || !['LEADER', 'ADMIN'].includes(membership.role)) {
            return new NextResponse('Görev oluşturma yetkiniz yok.', { status: 403 });
        }

        const body = await request.json();
        const validation = createTaskSchema.safeParse(body);
        if (!validation.success) {
            return new NextResponse('Geçersiz veri', { status: 400 });
        }
        const { title, type, assigneeIds } = validation.data;

        const newTask = await prisma.task.create({
            data: {
                title,
                type,
                projectId,
                status: TaskStatus.TODO,
                assignees: assigneeIds ? {
                    create: assigneeIds.map(id => ({ userId: id }))
                } : undefined,
            },
            include: { assignees: { include: { user: { select: { username: true, profileImage: true } } } } }
        });

        return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
        console.error("[CREATE_TASK_ERROR]", error);
        return new NextResponse('Sunucu Hatası', { status: 500 });
    }
}