import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Gelen isteğin body'sini doğrulamak için bir Zod şeması oluşturuyoruz.
// Bu, hem güvenlik hem de veri tutarlılığı için çok önemlidir.
const updateProfileSchema = z.object({
  // Kullanıcı adının 3-20 karakter arasında, sadece harf, rakam, _ ve - içermesine izin verelim.
  username: z.string()
    .min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır." })
    .max(20, { message: "Kullanıcı adı en fazla 20 karakter olabilir." })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Kullanıcı adı sadece harf, rakam, _ ve - içerebilir." }),
  
  // Bio en fazla 300 karakter olabilir.
  bio: z.string()
    .max(300, { message: "Biyografi en fazla 300 karakter olabilir." })
    .optional(), // Bio'nun boş gönderilmesine izin veriyoruz.
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
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      // Eğer doğrulama başarısızsa, hataları detaylı bir şekilde geri döndür.
      return new NextResponse(JSON.stringify({ message: "Geçersiz veri", errors: validation.error.flatten().fieldErrors }), { status: 400 });
    }

    const { username, bio } = validation.data;

    // 3. Yeni kullanıcı adının başkası tarafından kullanılıp kullanılmadığını kontrol et
    // (Sadece mevcut kullanıcı adından farklıysa bu kontrolü yap)
    if (username !== session.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return new NextResponse(JSON.stringify({ message: "Bu kullanıcı adı zaten alınmış." }), { status: 409 }); // 409 Conflict
      }
    }

    // 4. Veritabanını güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username,
        bio: bio,
      },
      // Sadece gerekli alanları seçerek geri döndürelim
      select: {
        id: true,
        username: true,
        bio: true,
        email: true,
        skills: true,
        demos: true,
      }
    });

    // 5. Başarılı yanıtı, güncellenmiş kullanıcı bilgileriyle birlikte döndür.
    // Bu, frontend'in sayfayı anında güncellemesini sağlar.
    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return new NextResponse('Sunucu hatası', { status: 500 });
  }
}