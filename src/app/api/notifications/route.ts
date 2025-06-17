// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// --- GET: Kullanıcının Bildirimlerini Getir ---
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const userId = parseInt(session.user.id);

  try {
    const userNotifications = await prisma.userNotification.findMany({
      where: { userId },
      orderBy: { notification: { createdAt: 'desc' } },
      take: 20,
      include: {
        notification: true, // Ana bildirim detaylarını al
      },
    });

    // --- YENİ MANTIK: Bildirimlere proje resimlerini ekle ---
    const notificationsWithProjectImages = await Promise.all(
      userNotifications.map(async (userNotif) => {
        // Link'ten proje slug'ını çıkaralım. Örn: "/projeler/proje-slug" -> "proje-slug"
        const slug = userNotif.notification.link.split('/').pop();

        if (!slug) {
          return { ...userNotif, projectImages: null }; // Link formatı bozuksa
        }

        const project = await prisma.project.findUnique({
          where: { slug },
          select: {
            coverImagePublicId: true,
            bannerImagePublicId: true,
          },
        });

        return {
          ...userNotif,
          projectImages: project // Bildirim objesine proje resimlerini ekle
            ? { 
                cover: project.coverImagePublicId, 
                banner: project.bannerImagePublicId 
              }
            : null,
        };
      })
    );
    // ----------------------------------------------------

    const unreadCount = await prisma.userNotification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({ notifications: notificationsWithProjectImages, unreadCount });
  } catch (error) {
    console.error("Bildirimler getirilirken hata:", error);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}

// --- POST: Tüm Bildirimleri Okundu Olarak İşaretle ---
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
    }
    const userId = parseInt(session.user.id);

    try {
        await prisma.userNotification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return NextResponse.json({ message: 'Tüm bildirimler okundu.' });
    } catch (error) {
        console.error("Bildirimler okunurken hata:", error);
        return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
    }
}