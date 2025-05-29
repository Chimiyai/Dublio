// Örnek: /api/games/add-to-library/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
  }

  const { projectId } = await request.json();
  if (!projectId || typeof projectId !== 'number') {
    return NextResponse.json({ error: 'Geçersiz proje ID.' }, { status: 400 });
  }

  const userId = parseInt(session.user.id, 10); // Session ID'si string ise

  try {
    // Projenin gerçekten satılık bir oyun olup olmadığını kontrol et (opsiyonel ama iyi)
    const project = await prisma.project.findFirst({
      where: { id: projectId, type: 'oyun', price: { not: null } }
    });
    if (!project) {
      return NextResponse.json({ error: 'Satın alınabilir oyun bulunamadı.' }, { status: 404 });
    }

    // Kullanıcının zaten sahip olup olmadığını kontrol et
    const existingOwnership = await prisma.userOwnedGame.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });
    if (existingOwnership) {
      return NextResponse.json({ message: 'Bu oyuna zaten sahipsiniz.' }, { status: 200 });
    }

    // Kütüphaneye ekle
    const ownedGame = await prisma.userOwnedGame.create({
      data: {
        userId,
        projectId,
        purchasePrice: project.price, // Satın alındığı andaki fiyatı kaydet
      }
    });
    return NextResponse.json({ message: `${project.title} kütüphanenize eklendi!`, ownedGame }, { status: 201 });
  } catch (error) {
    console.error("Error adding game to library:", error);
    return NextResponse.json({ error: 'Oyun kütüphaneye eklenirken bir hata oluştu.' }, { status: 500 });
  }
}