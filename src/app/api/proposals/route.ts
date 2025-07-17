// src/app/api/proposals/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Prisma'nın tiplerini import ediyoruz

// === DÜZELTME 1: Zod şemasını güncelliyoruz ===
const proposalSchema = z.object({
  teamId: z.number().int(),
  contentId: z.number().int(),
  message: z.string().optional(),
  // `z.record` fonksiyonu iki argüman alır: keyType ve valueType.
  // Bizim durumumuzda ikisi de string.
  storageMapping: z.record(z.string(), z.string()), 
});

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Yetkisiz', { status: 401 });
        }
        
        const body = await request.json();
        const validation = proposalSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: "Geçersiz veri", errors: validation.error.flatten() }, { status: 400 });
        }
        
        const { teamId, contentId, message, storageMapping } = validation.data;
        
        // Yetki Kontrolü...
        const membership = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: { teamId: teamId, userId: parseInt(session.user.id) }
            }
        });

        if (!membership || membership.role !== 'LEADER') {
            return new NextResponse('Sadece lideri olduğunuz bir ekip adına teklif verebilirsiniz.', { status: 403 });
        }

        // Mevcut teklif kontrolü...
        const existingProposal = await prisma.projectProposal.findFirst({
            where: { teamId, contentId, status: 'PENDING' }
        });

        if (existingProposal) {
            return new NextResponse('Bu içerik için bu ekiple zaten beklemede olan bir teklifiniz var.', { status: 409 });
        }

        const newProposal = await prisma.projectProposal.create({
            data: {
                teamId: teamId,
                contentId: contentId,
                message: message,
                // === DÜZELTME 2: Tipi Prisma'nın anlayacağı şekle çeviriyoruz ===
                // Gelen objenin Prisma'nın `JsonValue` tipiyle uyumlu olduğunu TypeScript'e söylüyoruz.
                storageMapping: storageMapping as Prisma.JsonObject,
                status: 'PENDING'
            }
        });

        return NextResponse.json(newProposal, { status: 201 });

    } catch (error) {
        console.error("[PROPOSALS_POST_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}