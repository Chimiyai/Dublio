// src/app/api/payment/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

const pytrWebhookSecret = process.env.PYTR_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  
  // --- DÜZELTME: TypeScript'in önerdiği gibi 'await' ekliyoruz ---
  const headersList = await headers(); 
  const signature = headersList.get('pytr-signature');
  // ----------------------------------------------------------------

  let event;

  try {
    if (!pytrWebhookSecret || !signature) {
        console.warn("Webhook sırrı veya imza eksik. Güvenlik atlanıyor (SADECE GELİŞTİRME İÇİN).");
        event = JSON.parse(body);
    } else {
        // Burada Pytr'ın imza doğrulama mantığı olmalı.
        // Şimdilik parse ediyoruz.
        event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error('Webhook imza doğrulama hatası:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
  
  // Olay tipi kontrolü (Pytr dokümantasyonuna göre bu ismi güncelle)
  if (event.type === 'checkout.session.completed' || event.type === 'payment_succeeded') {
    const sessionWithMetadata = event.data.object;
    const { userId, projectId } = sessionWithMetadata.metadata;

    if (!userId || !projectId) {
      console.error('Webhook metadata içinde userId veya projectId eksik!', sessionWithMetadata.metadata);
      return new NextResponse('Webhook metadata hatası', { status: 400 });
    }

    try {
      await prisma.userOwnedGame.create({
        data: {
          userId: parseInt(userId),
          projectId: parseInt(projectId),
          purchasePrice: sessionWithMetadata.amount_total / 100,
        },
      });
      console.log(`Kullanıcı ${userId} için Proje ${projectId} kütüphaneye eklendi.`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('Bu sipariş zaten işlenmiş.');
        return NextResponse.json({ received: true });
      }
      console.error('Webhook veritabanı hatası:', error);
      return new NextResponse('Webhook veritabanı hatası.', { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}