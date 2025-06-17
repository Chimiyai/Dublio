// src/app/api/payment/create-session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
// import pytr from 'pytr-node'; // Eğer Pytr'ın bir SDK'sı varsa bu şekilde import edilebilir
// pytr.apiKey = process.env.PYTR_API_SECRET;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // 1. Kullanıcı Giriş Yapmış mı?
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Yetkisiz erişim. Lütfen giriş yapın.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ message: 'Proje ID\'si gerekli.' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // 2. Proje Bilgilerini Veritabanından Çek
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, price: true, currency: true }
    });

    if (!project || !project.price || project.price <= 0) {
      return NextResponse.json({ message: 'Satın alınabilir bir ürün bulunamadı.' }, { status: 404 });
    }
    
    // 3. Kullanıcı Zaten Sahip mi? (Ekstra Güvenlik Kontrolü)
    const existingOwnership = await prisma.userOwnedGame.findUnique({
        where: { userId_projectId: { userId, projectId } }
    });
    if (existingOwnership) {
        return NextResponse.json({ message: 'Bu oyuna zaten sahipsiniz.'}, { status: 409 });
    }

    // 4. Ödeme Sağlayıcı (Pytr) ile Ödeme Oturumu Oluştur
    // ---- BURASI PYTR DOKÜMANTASYONUNA GÖRE DEĞİŞECEK ----
    
    // Varsayımsal Pytr API isteği
    // Gerçekte pytr.checkout.sessions.create({...}) gibi bir SDK kullanımı olabilir
    const pytrSession = await createPytrCheckoutSession({
      amount: Math.round(project.price * 100), // Genellikle kuruş olarak gönderilir (örn: 15.99 TL -> 1599)
      currency: project.currency?.toLowerCase() || 'try',
      product_name: project.title,
      success_url: `${process.env.NEXTAUTH_URL}/projeler/${project.id}?satin_alma=basarili`, // Ödeme başarılı olunca dönülecek URL
      cancel_url: `${process.env.NEXTAUTH_URL}/projeler/${project.id}?satin_alma=iptal`,   // İptal edilince dönülecek URL
      metadata: { // EN ÖNEMLİ KISIM: Webhook için hangi kullanıcı neyi aldı bilgisini sakla
        userId: userId,
        projectId: projectId,
      },
      // customer_email: session.user.email, // Gerekirse müşteri bilgisi
    });
    // --------------------------------------------------------

    if (!pytrSession || !pytrSession.url) {
        throw new Error('Pytr ile ödeme oturumu oluşturulamadı.');
    }
    
    // 5. Frontend'e Ödeme Sayfasının URL'ini Döndür
    return NextResponse.json({ checkoutUrl: pytrSession.url });

  } catch (error) {
    console.error("Ödeme oturumu oluşturma hatası:", error);
    return NextResponse.json({ message: (error as Error).message || 'Bir sunucu hatası oluştu.' }, { status: 500 });
  }
}

// ---- BU FONKSİYON TAMAMEN VARSAYIMSALDIR ----
// Pytr'a gerçek isteği nasıl atacağını dokümantasyonlarına bakarak bu fonksiyonu doldurmalısın.
async function createPytrCheckoutSession(options: { 
    amount: number, currency: string, product_name: string, 
    success_url: string, cancel_url: string, metadata: object 
}) {
    console.log("Pytr'a gönderilecek veri:", options);
    // Örnek bir fetch isteği:
    // const response = await fetch('https://api.pytr.com/v1/checkout/sessions', {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${process.env.PYTR_API_SECRET}`,
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(options)
    // });
    // const data = await response.json();
    // return data;

    // Şimdilik test için sahte bir URL döndürelim:
    // Gerçek entegrasyon için bu kısmı silip yukarıdaki fetch isteğini kullanmalısın.
    return {
        id: 'cs_test_12345',
        url: 'https://prestijstudio.com/odeme-basarili-test' // TEST AMAÇLI, Pytr'dan gelen gerçek URL olmalı
    };
}