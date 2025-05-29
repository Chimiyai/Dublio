// src/app/api/comments/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptions yolunu kontrol edin

interface Params {
  params: { commentId: string };
}

// ÖNCEKİ ÇALIŞAN GET FONKSİYONUNU İSTERSEN YORUM SATIRI YAPABİLİRSİN
// VEYA KOMPLE SİLİP YERİNE PRISMA'LI GET'İ KOYABİLİRSİN (ŞİMDİLİK SİLME İŞLEMİNE ODAKLANALIM)
/*
export async function GET(request: NextRequest, { params }: { params: { commentId: string } }) {
  const commentId = params.commentId;
  console.log(`[commentId] GET isteği alındı: /api/comments/${commentId}`);
  // Burada normalde bir yorumu getirme mantığı olmalı, ama şimdilik DELETE'e odaklanıyoruz.
  // İstersen bu GET'i, o ID'li yorumu Prisma ile çeken bir koda dönüştürebilirsin.
  const singleComment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) },
      include: { user: { select: { username: true, profileImagePublicId: true } } }
  });
  if (!singleComment) {
      return NextResponse.json({ message: "Yorum bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(singleComment, { status: 200 });
}
*/

export async function DELETE(request: NextRequest, { params }: Params) {
  console.log(`API: /api/comments/${params.commentId} DELETE isteği başladı.`); // Log eklendi

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("API: Yetkisiz erişim (session yok).");
    return NextResponse.json({ message: 'Bu işlem için giriş yapmalısınız.' }, { status: 401 });
  }

  const commentIdParam = params.commentId;
  const commentId = parseInt(commentIdParam);

  if (isNaN(commentId)) {
    console.log(`API: Geçersiz yorum ID formatı: ${commentIdParam}`);
    return NextResponse.json({ message: 'Geçersiz yorum ID formatı.' }, { status: 400 });
  }

  const userId = parseInt(session.user.id);
  const userRole = session.user.role;
  console.log(`API: İstek yapan kullanıcı ID: ${userId}, Rol: ${userRole}, Silinecek Yorum ID: ${commentId}`);

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, projectId: true }, // projectId'yi de alabilirsin, belki lazım olur
    });

    if (!comment) {
      console.log(`API: Yorum bulunamadı (ID: ${commentId}).`);
      return NextResponse.json({ message: 'Yorum bulunamadı.' }, { status: 404 });
    }
    console.log(`API: Yorum bulundu:`, comment);

    if (comment.userId !== userId && userRole !== 'admin') {
      console.log(`API: Yetkisiz silme denemesi (Yorum sahibi: ${comment.userId}, İstek yapan: ${userId}, Rol: ${userRole}).`);
      return NextResponse.json({ message: 'Bu yorumu silme yetkiniz yok.' }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });
    console.log(`API: Yorum başarıyla silindi (ID: ${commentId}).`);
    
    return NextResponse.json({ message: 'Yorum başarıyla silindi.' }, { status: 200 });
  } catch (error: any) {
    console.error(`API: Yorum silme hatası (ID: ${commentId}):`, error);
    return NextResponse.json({ message: 'Yorum silinirken sunucuda bir hata oluştu.' }, { status: 500 });
  }
}