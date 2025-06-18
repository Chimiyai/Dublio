// src/app/api/users/[userId]/(actions)/report/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

interface RouteContext { params: { userId: string } }

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> } // <<< İMZAYI GÜNCELLE
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Bu işlemi yapmak için giriş yapmalısınız.' }, { status: 401 });
  }

  const resolvedParams = await params; // `await` ile çöz
  const reportedId = parseInt(resolvedParams.userId, 10); // Raporlanan kişi
  const reporterId = parseInt(session.user.id); // Raporlayan kişi
  
  if (isNaN(reportedId)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  if (reporterId === reportedId) {
    return NextResponse.json({ message: 'Kendinizi raporlayamazsınız.' }, { status: 400 });
  }
  
  const { reason, description } = await request.json(); 
  if (!reason) {
    return NextResponse.json({ message: 'Rapor sebebi belirtilmelidir.' }, { status: 400 });
  }

  try {
    // Kullanıcının daha önce aynı kişiyi raporlayıp raporlamadığını kontrol et
    const existingReport = await prisma.userReport.findUnique({
      where: { reporterId_reportedId: { reporterId, reportedId } },
    });
    if (existingReport) {
      return NextResponse.json({ message: 'Bu kullanıcıyı zaten raporladınız.' }, { status: 409 });
    }

    await prisma.userReport.create({
      data: {
        reporterId,
        reportedId,
        reason,
        description,
      },
    });

    return NextResponse.json({ message: 'Kullanıcı başarıyla raporlandı. Gerekli incelemeler yapılacaktır.' });

  } catch (error) {
    console.error("Kullanıcı raporlama hatası:", error);
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 });
  }
}