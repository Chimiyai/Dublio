// src/app/api/payment/webhook/shopier/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Shopier } from 'shopier-api'; // <<< ShopierCallback kaldırıldı

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // Gelen verinin tipini `any` olarak alıp, alanlara güvenli erişim yapalım
    const params: any = Object.fromEntries(formData);
    
    console.log("Shopier Webhook Geldi:", params);

    // --- DÜZELTME 1: Paketi doğru şekilde başlat ---
    const shopier = new Shopier(
        process.env.SHOPIER_API_KEY!,
        process.env.SHOPIER_API_SECRET!
    );
    // ---------------------------------------------

    // --- Shopier callback ile imza ve ödeme doğrulama ---
    const callbackResult = shopier.callback(params);

    if (!callbackResult) {
      console.error("Geçersiz Shopier imzası!");
      return new NextResponse('Invalid signature', { status: 401 });
    }

    if (params.status === 'success') {
      const platformOrderId = params.platform_order_id;
      
      const parts = platformOrderId.split('-');
      if (parts[0] === 'DUBLIO' && parts.length >= 3) {
        const projectId = parseInt(parts[1]);
        const userId = parseInt(parts[2]);

        if (!isNaN(projectId) && !isNaN(userId)) {
          await prisma.userOwnedGame.upsert({
            where: { userId_projectId: { userId, projectId } },
            update: {},
            // Shopier'dan gelen para birimi string olabilir, float'a çeviriyoruz
            create: { userId, projectId, purchasePrice: parseFloat(params.total_order_value) }
          });
          console.log(`Webhook ile oyun kütüphaneye eklendi: Kullanıcı ID ${userId}, Proje ID ${projectId}`);
        }
      }
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error("Shopier webhook hatası:", error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}