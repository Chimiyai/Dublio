// src/app/api/admin/reports/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  try {
    const reports = await prisma.userReport.findMany({
      orderBy: {
        createdAt: 'desc', // En yeni raporlar üstte
      },
      include: {
        // Raporlayan ve raporlanan kullanıcıların bilgilerini de alalım
        reporter: {
          select: { id: true, username: true },
        },
        reported: {
          select: { id: true, username: true },
        },
      },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Raporlar listelenirken hata:", error);
    return NextResponse.json({ message: "Raporlar getirilirken bir hata oluştu." }, { status: 500 });
  }
}