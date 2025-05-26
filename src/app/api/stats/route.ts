// src/app/api/stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  console.log("API /api/stats GET request received");
  try {
    // 1. Toplam Kullanıcı Sayısı
    const totalUsers = await prisma.user.count();
    console.log("Total Users:", totalUsers);

    // 2. Toplam Türkçe Dublajlı Oyun Sayısı
    // Prisma şemanızda Project > type alanı String olduğu için doğrudan string karşılaştırması yapacağız.
    // Veritabanınızda 'oyun' mu 'Oyun' mu yazdığına dikkat edin.
    const totalDubbedGames = await prisma.project.count({
      where: {
        type: 'oyun', // VEYA 'Oyun' - VERİTABANINIZDAKİ DEĞERE GÖRE DEĞİŞTİRİN
        isPublished: true,
      },
    });
    console.log("Total Dubbed Games:", totalDubbedGames);

    // 3. Toplam Türkçe Dublajlı Anime Sayısı
    const totalDubbedAnime = await prisma.project.count({
      where: {
        type: 'anime', // VEYA 'Anime' - VERİTABANINIZDAKİ DEĞERE GÖRE DEĞİŞTİRİN
        isPublished: true,
      },
    });
    console.log("Total Dubbed Anime:", totalDubbedAnime);

    // 4. Toplam Ekip Üyesi Sayısı (DubbingArtist tablosundan)
    const totalTeamMembers = await prisma.dubbingArtist.count();
    console.log("Total Team Members (Dubbing Artists):", totalTeamMembers);

    // 5. Toplam Oyun İsteği Sayısı
    // Bu kısmı kendi projenizdeki "istek" mantığına göre uyarlamanız gerekiyor.
    // Eğer projelerin bir 'status' alanı varsa ve 'REQUESTED' gibi bir değer alıyorsa:
    /*
    const totalGameRequests = await prisma.project.count({
      where: {
        type: 'oyun', // Sadece oyun istekleri
        status: 'REQUESTED', // Örnek bir status değeri
      }
    });
    */
    // Veya eğer Message modelinde bir "request_type" alanı varsa:
    /*
    const totalGameRequests = await prisma.message.count({
        where: {
            requestType: 'GAME_DUB_REQUEST', // Örnek bir istek tipi
        }
    });
    */
    // ŞİMDİLİK ÖRNEK BİR DEĞER ATIYORUM, BURAYI KENDİ MANTIĞINIZA GÖRE GÜNCELLEYİN!
    const totalGameRequests = 0; // VEYA GERÇEK SAYIMINIZ
    console.log("Total Game Requests (Placeholder):", totalGameRequests);

    // Son 30 gün içinde eklenen oyunların sayısı
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGames = await prisma.project.count({
      where: {
        type: 'oyun',
        isPublished: true,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    const stats = {
      totalUsers,
      totalDubbedGames,
      totalDubbedAnime,
      totalTeamMembers,
      totalGameRequests,
      recentGames,
    };

    console.log("Stats fetched successfully:", stats);
    return NextResponse.json(stats);

  } catch (error) {
    console.error("API Error in /api/stats:", error);
    let errorMessage = "İstatistikler getirilirken sunucu hatası.";
    if (error instanceof Error) {
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      console.error("Error Stack (first few lines):", error.stack?.split('\n').slice(0, 5).join('\n'));
      errorMessage = error.message; // Daha spesifik bir hata mesajı
       // Prisma'ya özgü hatalar için
       if ('code' in error && 'meta' in error) {
        console.error("Prisma Error Code:", (error as any).code);
        console.error("Prisma Error Meta:", (error as any).meta);
      }
    }
    return NextResponse.json(
      { error: "İstatistikler getirilirken bir hata oluştu.", details: errorMessage },
      { status: 500 }
    );
  }
}