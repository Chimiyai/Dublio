// src/app/api/teams/[teamId]/invitations/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma'; // Prisma'nın doğru şekilde import edildiğinden emin ol
import { z } from 'zod';

const inviteSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı boş olamaz."),
});

// Fonksiyonun tanımını Next.js'in beklediği standart formata getiriyoruz
export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    // 1. Prisma istemcisinin var olup olmadığını kontrol edelim
    if (!prisma) {
      throw new Error("Prisma client is not available");
    }

    // 2. Oturum ve parametreleri alalım
    const session = await getServerSession(authOptions);
    const teamIdString = params.teamId;

    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz işlem', { status: 401 });
    }
    
    if (!teamIdString) {
        return new NextResponse('Ekip ID bilgisi eksik', { status: 400 });
    }

    const inviterId = parseInt(session.user.id, 10);
    const teamId = parseInt(teamIdString, 10);

    if (isNaN(teamId)) {
        return new NextResponse('Geçersiz Ekip ID', { status: 400 });
    }
    
    // 3. Yetki kontrolü
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: inviterId } },
      select: { role: true } // Sadece role'ü çekmek daha verimli
    });

    if (membership?.role !== 'LEADER') {
      return new NextResponse('Bu işlemi yapma yetkiniz yok.', { status: 403 });
    }

    // 4. Gelen veriyi doğrula
    const body = await request.json();
    const validation = inviteSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse('Geçersiz veri', { status: 400 });
    }
    const { username: invitedUsername } = validation.data;
    
    // 5. Davet edilen kullanıcıyı bul
    const invitedUser = await prisma.user.findUnique({
      where: { username: invitedUsername }
    });
    if (!invitedUser) {
      return new NextResponse(`'${invitedUsername}' adında bir kullanıcı bulunamadı.`, { status: 404 });
    }

    // 6. Mantıksal kontroller (kendini davet, zaten üye olma vb.)
    if (invitedUser.id === inviterId) {
        return new NextResponse('Kendinizi davet edemezsiniz.', { status: 400 });
    }
    const isAlreadyMember = await prisma.teamMember.count({
        where: { teamId: teamId, userId: invitedUser.id }
    });
    if (isAlreadyMember > 0) {
        return new NextResponse('Bu kullanıcı zaten ekipte.', { status: 409 });
    }

    // 7. Mevcut daveti yönet
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: { teamId_invitedUserId: { teamId, invitedUserId: invitedUser.id } }
    });
    if (existingInvitation) {
        if (existingInvitation.status === 'PENDING') {
            return new NextResponse('Bu kullanıcıya zaten bir davet gönderilmiş.', { status: 409 });
        }
        // Eğer reddedilmiş veya kabul edilmişse, eskisini silip yenisini oluşturalım.
        await prisma.teamInvitation.delete({ where: { id: existingInvitation.id } });
    }
    
    // 8. Yeni daveti oluştur
    const newInvitation = await prisma.teamInvitation.create({
      data: {
        teamId: teamId,
        invitedUserId: invitedUser.id,
        inviterId: inviterId,
        status: 'PENDING',
      },
      include: {
        invitedUser: { select: { username: true } }
      }
    });

    return NextResponse.json(newInvitation, { status: 201 });

  } catch (error: any) {
    // Hatanın kendisini loglayarak daha fazla bilgi alalım
    console.error("[TEAM_INVITATION_POST_ERROR]", error);
    return new NextResponse(error.message || 'Sunucu hatası', { status: 500 });
  }
}