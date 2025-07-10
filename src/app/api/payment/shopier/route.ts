// src/app/api/payment/create-session/shopier/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { Shopier } from 'shopier-api'; // <<< DEĞİŞİKLİK: Doğru paketi import et

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email || !session.user.username) {
    return NextResponse.json({ message: 'Giriş yapmalısınız.' }, { status: 401 });
  }

  try {
    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json({ message: 'Proje ID\'si gerekli.' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const user = session.user;

    if (!project || !project.price || project.price <= 0) {
      return NextResponse.json({ message: 'Satın alınabilir bir ürün bulunamadı.' }, { status: 404 });
    }

    // `shopier-api` paketini başlat
    const shopier = new Shopier(
        process.env.SHOPIER_API_KEY!,
        process.env.SHOPIER_API_SECRET!
    );

    const platformOrderId = `PRESTIJ-${projectId}-${user.id}-${Date.now()}`;
    
    // 1. Alıcı bilgilerini ayarla
    shopier.setBuyer({
      buyer_id_nr: user.id,
      product_name: project.title,
      buyer_name: user.username,
      buyer_surname: '.',
      buyer_email: user.email,
      buyer_phone: '5555555555'
    });

    // 2. Fatura adresini ayarla
    shopier.setOrderBilling({
      billing_address: "Adres Gerekli Değil",
      billing_city: "Istanbul",
      billing_country: "Türkiye",
      billing_postcode: "34000"
    });

    // 3. Kargo adresini ayarla
    shopier.setOrderShipping({
      shipping_address: "Adres Gerekli Değil",
      shipping_city: "Istanbul",
      shipping_country: "Türkiye",
      shipping_postcode: "34000"
    });

    // 4. Ödeme formu HTML'i oluştur
    const paymentHTML = shopier.generatePaymentHTML(project.price);

    return NextResponse.json({ paymentHTML });

  } catch (error) {
    console.error("Shopier ödeme oturumu oluşturma hatası:", error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
    return NextResponse.json({ message: `Bir hata oluştu: ${errorMessage}` }, { status: 500 });
  }
}