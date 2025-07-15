// src/app/api/interactions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { PrismaClient, InteractionType } from '@prisma/client';

// Gelen isteğin body'sini doğrulamak için bir Zod şeması
const interactionSchema = z.object({
  targetId: z.number().int().positive(),
  targetType: z.enum(["PROJECT", "TEAM", "CONTENT", "USER_DEMO", "COMMENT", "PACKAGE_VERSION"]),
  type: z.nativeEnum(InteractionType), // "LIKE" veya "FAVORITE"
});

// --- ETKİLEŞİM EKLEME (LIKE/FAVORITE) ---
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = parseInt(session.user.id);

    const body = await request.json();
    const validation = interactionSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ message: "Geçersiz istek verisi", errors: validation.error.flatten().fieldErrors }), { status: 400 });
    }

    const { targetId, targetType, type } = validation.data;

    const existingInteraction = await prisma.interaction.findUnique({
      where: {
        userId_type_targetType_targetId: { userId, type, targetType, targetId },
      },
    });

    if (existingInteraction) {
      return new NextResponse(JSON.stringify({ message: "Bu etkileşim zaten mevcut." }), { status: 409 });
    }

    await prisma.interaction.create({
      data: {
        userId,
        type,
        targetType,
        targetId,
      },
    });
    
    // Not: Gerçek dünyada, like/favorite sayısını güncellemek için 
    // ilgili modelin (Project, Team vs.) sayacını da artırmak gerekebilir. 
    // Şimdilik bunu basitleştiriyoruz.
    return new NextResponse(JSON.stringify({ message: "İşlem başarılı!" }), { status: 201 });

  } catch (error) {
    console.error("[INTERACTION_POST_ERROR]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


// --- ETKİLEŞİM KALDIRMA (UNLIKE/UNFAVORITE) ---
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = parseInt(session.user.id);

    // DELETE isteğinde body yerine URL'den parametre almak daha standarttır.
    // Ama client-side kodumuzu basit tutmak için şimdilik body kullanmaya devam edelim.
    const body = await request.json();
    const validation = interactionSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ message: "Geçersiz istek verisi" }), { status: 400 });
    }

    const { targetId, targetType, type } = validation.data;

    await prisma.interaction.delete({
      where: {
        userId_type_targetType_targetId: { userId, type, targetType, targetId },
      },
    });

    return new NextResponse(JSON.stringify({ message: "İşlem başarılı!" }), { status: 200 });

  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
       return new NextResponse(JSON.stringify({ message: "Kaldırılacak etkileşim bulunamadı." }), { status: 404 });
    }
    console.error("[INTERACTION_DELETE_ERROR]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}