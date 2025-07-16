//src/app/api/teams/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import slugify from 'slugify';

const createTeamSchema = z.object({
  name: z.string().min(3, "Ekip adı en az 3 karakter olmalıdır.").max(50),
  description: z.string().max(500, "Açıklama 500 karakteri geçemez.").optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Yetkisiz işlem', { status: 401 });
    }
    const ownerId = parseInt(session.user.id, 10);

    // TODO: Burada ekip kurmak için kullanıcının yeterli kredisi olup olmadığını
    // veya premium üye olup olmadığını kontrol eden bir mantık eklenebilir.
    // Şimdilik herkesin ekip kurabildiğini varsayıyoruz.

    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) {
      return new NextResponse(JSON.stringify({ errors: validation.error.flatten().fieldErrors }), { status: 400 });
    }

    const { name, description } = validation.data;
    
    // Ekip adı ve slug'ının benzersiz olduğundan emin ol
    const slug = slugify(name, { lower: true, strict: true });
    const existingTeam = await prisma.team.findFirst({
        where: { OR: [{ name }, { slug }] }
    });
    if(existingTeam) {
        return new NextResponse(JSON.stringify({ message: "Bu isimde veya benzer URL'de bir ekip zaten mevcut." }), { status: 409 });
    }

    // Ekibi oluştur ve kurucusunu "LEADER" rolüyle ilk üye olarak ekle.
    // Bu iki işlemi tek bir transaction içinde yaparak veri bütünlüğünü sağlıyoruz.
    const newTeam = await prisma.team.create({
      data: {
        name,
        slug,
        description,
        ownerId: ownerId,
        members: {
          create: [
            {
              userId: ownerId,
              role: 'LEADER', // Kurucu her zaman liderdir.
            },
          ],
        },
      },
      include: {
        members: true // Oluşturulan üyeyi de geri döndür
      }
    });

    return NextResponse.json(newTeam, { status: 201 });

  } catch (error) {
    console.error("[TEAMS_POST_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}