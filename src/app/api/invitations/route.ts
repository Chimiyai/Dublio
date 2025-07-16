// src/app/api/invitations/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// --- BU FONKSİYONUN VARLIĞI ÇOK ÖNEMLİ ---
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz', { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        invitedUserId: userId,
        status: 'PENDING',
      },
      include: {
        team: { select: { name: true, logoUrl: true } },
        inviter: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("[GET_INVITATIONS_ERROR]", error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}


// --- BİR DAVETİ YANITLAMA (KABUL/RED) ---
const respondInvitationSchema = z.object({
    invitationId: z.number().int(),
    response: z.enum(['ACCEPTED', 'DECLINED']),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz', { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    
    const body = await request.json();
    const validation = respondInvitationSchema.safeParse(body);
    if(!validation.success) {
        return new NextResponse('Geçersiz veri', { status: 400 });
    }
    const { invitationId, response } = validation.data;

    // 1. Davetin varlığını ve bu kullanıcıya ait olduğunu doğrula
    const invitation = await prisma.teamInvitation.findFirst({
        where: {
            id: invitationId,
            invitedUserId: userId,
            status: 'PENDING', // Sadece beklemedeki davetler yanıtlanabilir
        }
    });

    if(!invitation) {
        return new NextResponse('Yanıtlanacak geçerli bir davet bulunamadı.', { status: 404 });
    }

    // 2. Daveti yanıtla
    if (response === 'ACCEPTED') {
        // Kullanıcıyı ekibe ekle ve davetin durumunu güncelle
        // Bu iki işlem tek bir transaction içinde yapılmalı ki veri tutarlılığı korunsun.
        await prisma.$transaction([
            // A. Kullanıcıyı TeamMember tablosuna ekle
            prisma.teamMember.create({
                data: {
                    teamId: invitation.teamId,
                    userId: userId,
                    role: 'MEMBER', // Yeni üye varsayılan rolle başlar
                }
            }),
            // B. Davetin durumunu 'ACCEPTED' olarak güncelle
            prisma.teamInvitation.update({
                where: { id: invitationId },
                data: { status: 'ACCEPTED' }
            })
        ]);
        return NextResponse.json({ message: 'Davet kabul edildi!' });

    } else { // response === 'DECLINED'
        // Sadece davetin durumunu güncelle
        await prisma.teamInvitation.update({
            where: { id: invitationId },
            data: { status: 'DECLINED' }
        });
        return NextResponse.json({ message: 'Davet reddedildi.' });
    }

  } catch (error) {
    console.error("[RESPOND_INVITATION_ERROR]", error);
    return new NextResponse('Sunucu Hatası', { status: 500 });
  }
}