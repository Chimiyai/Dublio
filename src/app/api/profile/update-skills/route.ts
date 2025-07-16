//src/app/api/profile/update-skills/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Gelen isteğin body'sini doğrulayalım.
// Bir dizi string bekliyoruz, her string en fazla 50 karakter olabilir.
const updateSkillsSchema = z.object({
  skills: z.array(z.string().min(1).max(50)).max(10, { message: "En fazla 10 yetenek ekleyebilirsiniz." }),
});

export async function PUT(request: Request) {
  try {
    // 1. Kullanıcı oturumunu kontrol et
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz işlem', { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    // 2. Gelen veriyi al ve doğrula
    const body = await request.json();
    const validation = updateSkillsSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ message: "Geçersiz veri", errors: validation.error.flatten().fieldErrors }), { status: 400 });
    }

    const { skills: newSkills } = validation.data;

    const transaction = await prisma.$transaction([
      // A. Kullanıcının mevcut tüm yeteneklerini sil
      prisma.userSkill.deleteMany({
        where: { userId: userId },
      }),
      // B. Yeni yetenekleri ekle
      prisma.userSkill.createMany({
        data: newSkills.map(skillName => ({
          userId: userId,
          skillName: skillName,
        })),
        // HATA BURADAYDI, ŞİMDİ DÜZELTİYORUZ:
        // skipDuplicates: true, // <-- BU SATIRI SİL VEYA YORUM SATIRI YAP
      }),
    ]);

    // 4. Güncellenmiş yetenek listesini çekip geri döndür
    const updatedSkills = await prisma.userSkill.findMany({
      where: { userId: userId },
    });

    return NextResponse.json(updatedSkills, { status: 200 });

  } catch (error) {
    console.error("[SKILLS_UPDATE_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}