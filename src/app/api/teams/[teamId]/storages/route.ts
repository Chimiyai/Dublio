// src/app/api/teams/[teamId]/storages/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

const storageSchema = z.object({
  name: z.string().min(3),
  provider: z.string().min(3),
  config: z.object({
      url: z.string().url(),
  }),
  assetTypes: z.string().min(1), // Virgülle ayrılmış string
});

export async function POST(
    request: Request,
    { params }: { params: { teamId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const teamId = parseInt(params.teamId, 10);

        if (!session?.user?.id) {
            return new NextResponse('Yetkisiz', { status: 401 });
        }
        
        // Yetki Kontrolü: Sadece o ekibin lideri veya admini ekleme yapabilir.
        const membership = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: { teamId: teamId, userId: parseInt(session.user.id) }
            }
        });

        if (!membership || !['LEADER', 'ADMIN'].includes(membership.role)) {
            return new NextResponse('Bu işlem için yetkiniz yok', { status: 403 });
        }
        
        const body = await request.json();
        const validation = storageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: "Geçersiz veri" }, { status: 400 });
        }

        const newStorage = await prisma.teamStorage.create({
            data: {
                teamId: teamId,
                name: validation.data.name,
                provider: validation.data.provider,
                config: validation.data.config,
                assetTypes: validation.data.assetTypes
            }
        });

        return NextResponse.json(newStorage, { status: 201 });

    } catch (error) {
        console.error("[TEAM_STORAGES_POST_ERROR]", error);
        return new NextResponse("Sunucu hatası", { status: 500 });
    }
}