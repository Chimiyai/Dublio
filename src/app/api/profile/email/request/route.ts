import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto'; // Token üretimi için
import bcrypt from 'bcrypt'; // Token hash'lemek için
import { Resend } from 'resend'; // Resend SDK

// Zod şeması: Yeni e-posta
const requestEmailChangeSchema = z.object({
  newEmail: z.string().email({ message: "Geçersiz e-posta adresi." }),
});

// Resend istemcisini başlat (.env'deki API anahtarı ile)
const resend = new Resend(process.env.RESEND_API_KEY);

// E-posta gönderen adresi (Resend'de doğruladığın veya test adresi)
// Canlıda kendi domain'inizi kullanın!
const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'; 
// E-posta konusu
const emailSubject = "Dublio Dublaj - E-posta Adresi Doğrulama";
// Token geçerlilik süresi (örneğin 1 saat)
const TOKEN_EXPIRATION_MINUTES = 60;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id || !session.user?.email) { // Mevcut email de lazım olabilir
    return NextResponse.json({ message: 'Yetkisiz erişim.' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) {
     return NextResponse.json({ message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedBody = requestEmailChangeSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { message: 'Geçersiz veri.', errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { newEmail } = parsedBody.data;

    // 1. Yeni e-posta mevcut e-posta ile aynı mı?
    if (newEmail.toLowerCase() === session.user.email.toLowerCase()) {
        return NextResponse.json(
            { message: 'Yeni e-posta adresi mevcut adresinizle aynı olamaz.', errors: { newEmail: ['Bu zaten mevcut e-posta adresiniz.'] }}, 
            { status: 400 }
        );
    }

    // 2. Yeni e-posta başkası tarafından kullanılıyor mu?
    const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
        select: { id: true }
    });
    if (existingUser) {
        return NextResponse.json(
            { message: 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.', errors: { newEmail: ['Bu e-posta adresi zaten kayıtlı.'] }}, 
            { status: 409 } // Conflict
        );
    }
    
    // 3. Kullanıcının aktif bir talebi var mı? Varsa eskisini sil (veya hata ver)
    // Bu adım, kullanıcının kısa sürede çok sayıda talep oluşturmasını engeller.
    await prisma.emailChangeRequest.deleteMany({
        where: { userId: userId }
    });

    // 4. Güvenli doğrulama token'ı oluştur
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10); // Token'ı hash'le

    // 5. Token geçerlilik süresini hesapla
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000);

    // 6. Veritabanına e-posta değiştirme talebini kaydet
    await prisma.emailChangeRequest.create({
        data: {
            userId: userId,
            newEmail: newEmail,
            token: hashedToken, // Hash'lenmiş token'ı kaydet
            expiresAt: expiresAt,
        }
    });

    // 7. Doğrulama linkini oluştur (rawToken ile)
    const verificationUrl = `${process.env.NEXTAUTH_URL}/profil/dogrula/e-posta?token=${rawToken}`; // Bu URL yapısını sonra oluşturacağız
    console.log("!!! TEST: Doğrulama URL'si:", verificationUrl);
    // 8. Doğrulama e-postasını gönder (Resend ile)
  //  try {
  //      const { data, error } = await resend.emails.send({
  //          from: fromEmail, // Gönderen (Resend'de ayarlı)
  //          to: newEmail, // Yeni e-posta adresine gönder
  //          subject: emailSubject,
  //          html: `
  //              <h1>E-posta Adresinizi Doğrulayın</h1>
  //              <p>Merhaba,</p>
  //              <p>Dublio Dublaj hesabınız için e-posta adresi değişikliği talebinde bulundunuz.</p>
  //              <p>Yeni e-posta adresinizi (${newEmail}) doğrulamak için lütfen aşağıdaki bağlantıya tıklayın:</p>
  //              <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">E-postamı Doğrula</a>
  //              <p>Bu bağlantı ${TOKEN_EXPIRATION_MINUTES} dakika içinde sona erecektir.</p>
  //              <p>Eğer bu değişikliği siz talep etmediyseniz, bu e-postayı görmezden gelebilirsiniz.</p>
  //              <br/>
  //              <p>Teşekkürler,<br/>Dublio Dublaj Ekibi</p>
  //          `,
  //          // react: EmailTemplate({ verificationUrl }), // Veya React component kullanabilirsin
  //      });
//
  //      if (error) {
  //          console.error("Resend e-posta gönderme hatası:", error);
  //          // E-posta gönderilemezse, oluşturulan talebi geri alabiliriz (opsiyonel)
  //          // await prisma.emailChangeRequest.deleteMany({ where: { userId: userId }}); // Belki token ile silmek daha iyi
  //           return NextResponse.json({ message: 'Doğrulama e-postası gönderilirken bir hata oluştu. Lütfen tekrar deneyin.' }, { status: 500 });
  //      }
//
  //      console.log("Doğrulama e-postası gönderildi:", data);
//
  //  } catch (emailError) {
  //       console.error("E-posta gönderme genel hatası:", emailError);
  //       return NextResponse.json({ message: 'Doğrulama e-postası gönderilemedi.' }, { status: 500 });
  //  }

    // Başarılı yanıt (kullanıcıya e-postasını kontrol etmesini söyle)
    return NextResponse.json({ 
      message: `(TEST MODU) Doğrulama linki ${newEmail} adresine gönderildi varsayıldı. URL konsolda.`,
    }, { status: 200 });

  // --- BU ANA TRY BLOĞUNUN catch'İ ---
  } catch (error: any) { 
    console.error('E-posta değişikliği talep hatası:', error);
    return NextResponse.json(
      { message: 'E-posta değişikliği talebi sırasında bir sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
  // -----------------------------------
}