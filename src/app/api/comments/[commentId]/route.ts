// src/app/api/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Params interface'ine artık gerek yok, doğrudan tipi kullanıyoruz.
// interface Params {
//   params: { commentId: string };
// }

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ commentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("API: Yorum Silme - Yetkisiz erişim (session yok).");
    return NextResponse.json({ message: 'Bu işlem için giriş yapmalısınız.' }, { status: 401 });
  }

  const resolvedParams = await params;
  const commentIdStringFromParams = resolvedParams.commentId;

  if (!commentIdStringFromParams || typeof commentIdStringFromParams !== 'string' || commentIdStringFromParams.trim() === "") {
      console.log("API: Yorum Silme - Eksik veya geçersiz yorum ID parametresi.");
      return NextResponse.json({ message: 'Eksik veya geçersiz yorum ID parametresi.' }, { status: 400 });
  }
  
  // SADECE BİR KEZ commentId tanımla
  const commentId = parseInt(commentIdStringFromParams, 10); 

  if (isNaN(commentId)) {
    console.log(`API: Yorum Silme - Geçersiz yorum ID formatı: ${commentIdStringFromParams}`);
    return NextResponse.json({ message: 'Geçersiz yorum ID formatı.' }, { status: 400 });
  }

  const userId = parseInt(session.user.id);
  const userRole = session.user.role; // Bu session.user tipinde tanımlı olmalı
  console.log(`API: Yorum Silme - İstek yapan kullanıcı ID: ${userId}, Rol: ${userRole}, Silinecek Yorum ID: ${commentId}`);

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, projectId: true },
    });

    if (!comment) {
      console.log(`API: Yorum Silme - Yorum bulunamadı (ID: ${commentId}).`);
      return NextResponse.json({ message: 'Yorum bulunamadı.' }, { status: 404 });
    }
    // console.log(`API: Yorum Silme - Yorum bulundu:`, comment); // İsteğe bağlı log

    if (comment.userId !== userId && userRole !== 'admin') {
      console.log(`API: Yorum Silme - Yetkisiz silme denemesi.`);
      return NextResponse.json({ message: 'Bu yorumu silme yetkiniz yok.' }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });
    console.log(`API: Yorum Silme - Yorum başarıyla silindi (ID: ${commentId}).`);
    
    return NextResponse.json({ message: 'Yorum başarıyla silindi.' }, { status: 200 });
  } catch (error: any) {
    console.error(`API: Yorum Silme - Hata (ID: ${commentId}):`, error);
    if (error.code === 'P2025') { // Prisma'nın "kayıt bulunamadı" hatası
        return NextResponse.json({ message: 'Silinecek yorum bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Yorum silinirken sunucuda bir hata oluştu.' }, { status: 500 });
  }
}