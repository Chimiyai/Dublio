//src/app/api/tasks/[taskId]/status/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { TaskStatus } from '@prisma/client';

const updateStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

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
    // TODO: Yetki kontrolü - Bu görevi sadece projede yer alan bir üye güncelleyebilmeli.

    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse('Geçersiz statü verisi', { status: 400 });
    }
    const { status } = validation.data;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: status },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[UPDATE_TASK_STATUS_ERROR]", error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}