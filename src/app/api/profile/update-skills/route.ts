//src/app/api/profile/update-skills/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateSkillsSchema = z.object({
  skillIds: z.array(z.number().int().positive()),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Yetkisiz', { status: 401 });
    const userId = parseInt(session.user.id, 10);

    const body = await request.json();
    const validation = updateSkillsSchema.safeParse(body);
    if (!validation.success) return new NextResponse('Geçersiz veri', { status: 400 });

    const { skillIds } = validation.data;
    
    // Gelen ID'lerin gerçekten Skill tablosunda var olup olmadığını kontrol etmek
    // production'da iyi bir adımdır, şimdilik atlıyoruz.

    await prisma.$transaction([
      prisma.userSkill.deleteMany({ where: { userId: userId } }),
      prisma.userSkill.createMany({
        data: skillIds.map(id => ({
          userId: userId,
          skillId: id,
        })),
      }),
    ]);

    const updatedSkills = await prisma.userSkill.findMany({
      where: { userId: userId },
      include: { skill: true } // Frontend'e yeteneğin adını da göndermek için
    });
    return NextResponse.json(updatedSkills);
  } catch (error) {
    console.error("[SKILLS_UPDATE_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}