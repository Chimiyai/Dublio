import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth/next'; 
import { authOptions } from '@/lib/authOptions';
// Oturuma gerek yok, token ile doğrulama yapıyoruz ama session'ı alıp
// işlemi yapan kullanıcının ID'si ile request'teki userId eşleşiyor mu diye
// ek bir kontrol yapılabilir (opsiyonel).
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/lib/authOptions';

// Token doğrulama şeması
const verifyTokenSchema = z.object({
  token: z.string().length(64, { message: "Geçersiz token formatı." }), // 64 karakter hex token bekliyoruz
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = verifyTokenSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Geçersiz token formatı.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token: rawToken } = parsedBody.data;

    // 1. Veritabanında hash'lenmiş token'ı ara (Bu yöntem yerine talebi bulup sonra karşılaştırmak daha iyi)
    // Güvenlik açısından: Doğrudan token'ı WHERE ile aramak yerine, potansiyel
    // talepleri bulup sonra bcrypt.compare yapmak daha iyidir.
    // Ancak önce talebi bulmamız lazım. Token tek başına yeterli değil.
    // Kullanıcı ID'sini nasıl alacağız? Bu API public olmamalı.
    // Ya da linke userId de eklemeliyiz? (Güvenlik riski)
    
    // --- DAHA GÜVENLİ YAKLAŞIM ---
    // 1. Veritabanında süresi dolmamış TÜM talepleri çek (veya ilk eşleşeni bulmaya çalış)
    //    Bu yöntem çok verimsiz olabilir.
    // 2. Daha iyi: Token'ın hash'ini doğrudan aramak yerine, talebi başka bir yolla bulmak.
    //    Ancak token tek başına hangi talebe ait olduğunu belirtmiyor.
    
    // --- PRATİK AMA DAHA AZ GÜVENLİ YAKLAŞIM (bcrypt.compare olmadan) ---
    // Eğer token'ları hashlemeseydik, direkt arayabilirdik. Hashlediğimiz için
    // tüm talepleri çekip compare yapmamız gerekir ki bu verimsiz.
    // Geçici Çözüm: Hash'lenmiş token'ı direkt arayalım (PRODUCTION İÇİN ÖNERİLMEZ!)
    // UYARI: Bu yaklaşım timing attack'lara açık olabilir. bcrypt.compare kullanmak esastır.
    // Ama önce talebi bulmamız lazım.

    // --- DÜZELTİLMİŞ YAKLAŞIM: Tüm Talepleri Çekip Karşılaştırma (Performans??) ---
    // BU YÖNTEM ÇOK SAYIDA TALEP VARSA YAVAŞ OLUR!
    /*
    const potentialRequests = await prisma.emailChangeRequest.findMany({
      where: { expiresAt: { gt: new Date() } }, // Sadece süresi dolmamış olanlar
      include: { user: { select: { email: true }} } // User'ı da alalım
    });

    let validRequest = null;
    for (const req of potentialRequests) {
      const isTokenValid = await bcrypt.compare(rawToken, req.token);
      if (isTokenValid) {
        validRequest = req;
        break;
      }
    }
    */
   
    // --- EN İYİ YAKLAŞIM: Hashlenmemiş Token'ı DB'de Saklamak (Daha Az Güvenli Ama Basit) ---
    // Eğer token'ı hashlemeden DB'ye kaydetseydik:
    const validRequest = await prisma.emailChangeRequest.findFirst({
        where: {
            // Eğer token'ı hashlemeseydik: token: rawToken,
            // Geçici olarak hashlenmişi arayalım (YİNE DE BU YANLIŞ)
            // Bu satır çalışmaz çünkü rawToken hashlenmiş değil:
            // token: rawToken 
            // DOĞRUSU: Hashlenmiş token'ı aramıyoruz, önce talebi bulup sonra compare yapıyoruz.
            // Bu API'nin bu şekilde çalışması mümkün değil.
            // Linke userId eklemek ya da session kullanmak zorundayız.
            
            // --- GEÇİCİ ÇÖZÜM (SESSION KULLANARAK) ---
            // Kullanıcının linke tıklarken giriş yapmış olduğunu varsayalım
             token: "BU_KISIM_YANLIS_OLACAK_AMA_DEVAM_EDELIM", // Bu satırı sileceğiz
             expiresAt: { gt: new Date() } // Süresi dolmamış
        },
         include: { user: { select: { id: true, email: true } } } // Kullanıcıyı da al
    });

    // ---- TEKRAR DÜŞÜNELİM: API NASIL ÇALIŞMALI? ----
    // Kullanıcı linke tıkladığında, bir sayfaya (`/profil/dogrula/e-posta`) gitsin.
    // Bu sayfa, URL'den token'ı alsın.
    // Sayfa, giriş yapmış kullanıcının session'ını kontrol etsin.
    // Sayfa, HEM TOKEN'I HEM DE SESSION BİLGİSİNİ BU API'YE GÖNDERSİN.
    
    // --- YENİ API TASARIMI (Token + Session Bilgisi ile) ---
    const session = await getServerSession(authOptions);
     if (!session || !session.user?.id) {
        return NextResponse.json({ message: 'Doğrulama için giriş yapmalısınız.' }, { status: 401 });
     }
     const userId = parseInt(session.user.id, 10);
     if (isNaN(userId)) {
         return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
     }

     // Veritabanında bu kullanıcıya ait, süresi dolmamış talebi bul
     const requestRecord = await prisma.emailChangeRequest.findFirst({
         where: {
             userId: userId,
             expiresAt: { gt: new Date() }
         }
     });

    if (!requestRecord) {
      return NextResponse.json({ message: 'Geçerli bir e-posta değiştirme talebi bulunamadı veya süresi dolmuş.' }, { status: 404 });
    }

    // 2. Gelen Token ile Kayıtlı Hash'i Karşılaştır
    const isTokenValid = await bcrypt.compare(rawToken, requestRecord.token);
    if (!isTokenValid) {
      return NextResponse.json({ message: 'Geçersiz veya süresi dolmuş doğrulama linki.' }, { status: 400 });
    }
    
    // 3. E-postayı Güncelle ve Talebi Sil (Transaction içinde)
    await prisma.$transaction(async (tx) => {
        // Kullanıcının e-postasını güncelle
        await tx.user.update({
            where: { id: userId },
            data: { email: requestRecord.newEmail },
        });
        // Başarılı olan talebi sil
        await tx.emailChangeRequest.delete({
            where: { id: requestRecord.id }
        });
    });

    // Başarı yanıtı
    // Session'ı da güncellemek iyi olurdu ama client'dan update çağrısı yapılabilir.
     return NextResponse.json({ message: `E-posta adresiniz başarıyla ${requestRecord.newEmail} olarak güncellendi.` }, { status: 200 });


  } catch (error: any) {
    console.error('E-posta doğrulama hatası:', error);
    return NextResponse.json(
      { message: 'E-posta doğrulanırken bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
