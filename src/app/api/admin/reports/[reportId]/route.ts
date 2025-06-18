// src/app/api/admin/reports/[reportId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';

// Rapor durumunu güncellemek için Zod şeması
const updateReportStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved'], {
    errorMap: () => ({ message: "Geçersiz durum değeri. Sadece 'pending', 'reviewed', veya 'resolved' olabilir." }),
  }),
});

interface RouteContext {
  params: {
    reportId: string;
  };
}

// --- PUT: Raporun Durumunu Güncelle ---
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ reportId: string }> } // <<< İMZAYI GÜNCELLE
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }
  const resolvedParams = await params;
  const reportId = parseInt(resolvedParams.reportId, 10);
  if (isNaN(reportId)) {
    return NextResponse.json({ message: 'Geçersiz ID formatı.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedBody = updateReportStatusSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ errors: parsedBody.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status } = parsedBody.data;

    const updatedReport = await prisma.userReport.update({
      where: { id: reportId },
      data: { status: status },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error(`Rapor (ID: ${reportId}) durumu güncellenirken hata:`, error);
    return NextResponse.json({ message: "Rapor durumu güncellenirken bir hata oluştu." }, { status: 500 });
  }
}

// --- DELETE: Raporu Sil ---
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ reportId: string }> } // <<< İMZAYI GÜNCELLE
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const resolvedParams = await params; // `await` ile çöz
  const reportId = parseInt(resolvedParams.reportId, 10);
  if (isNaN(reportId)) {
    return NextResponse.json({ message: 'Geçersiz ID formatı.' }, { status: 400 });
  }

  try {
    await prisma.userReport.delete({
      where: { id: reportId },
    });

    return new NextResponse(null, { status: 204 }); // Başarılı, içerik yok
  } catch (error) {
    console.error(`Rapor (ID: ${reportId}) silinirken hata:`, error);
    return NextResponse.json({ message: "Rapor silinirken bir hata oluştu." }, { status: 500 });
  }
}