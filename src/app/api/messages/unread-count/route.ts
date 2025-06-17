// src/app/api/messages/unread-count/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 }); // Giriş yapmamışsa sayı 0'dır.
  }

  try {
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: parseInt(session.user.id),
        isRead: false,
      },
    });
    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Okunmamış mesaj sayısı alınırken hata:", error);
    return NextResponse.json({ message: "Bir hata oluştu" }, { status: 500 });
  }
}