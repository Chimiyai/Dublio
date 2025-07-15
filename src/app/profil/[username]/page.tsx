// src/app/profil/[username]/page.tsx

import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
// DİKKAT: Prisma ve tiplerini aynı yerden import ediyoruz.
import { Prisma, InteractionType } from '@prisma/client'; 
import UserProfileContent from '@/components/profile/UserProfileContent';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// 1. userProfileQuery'yi doğru tiplerle güncelliyoruz.
const userProfileQuery = {
  include: {
    skills: true,
    demos: true,
    teamMemberships: {
      include: {
        team: { select: { name: true, slug: true, logoUrl: true } }
      }
    },
    // _count sorgusunu doğru enum tipiyle yazıyoruz.
    _count: {
      select: {
        // 'interactions' değil, kullanıcının demolarına gelen beğenileri sayalım.
        // Bu daha mantıklı bir metrik.
        // Prisma, User modelindeki "demos" ilişkisi üzerinden sayım yapmamıza izin vermez,
        // bu yüzden bu sayımı ayrı bir sorgu ile yapacağız.
        // Şimdilik _count'u basitleştirelim veya kaldıralım.
      }
    }
  }
};

// 2. Tipi oluşturuyoruz.
export type UserWithProfile = Prisma.UserGetPayload<typeof userProfileQuery> & {
    // Toplam demo beğeni sayısını manuel olarak ekleyeceğimiz bir alan
    totalDemoLikes: number;
};


// 3. Veri çekme fonksiyonunu güncelliyoruz.
async function getUserProfile(username: string): Promise<UserWithProfile | null> {
  const user = await prisma.user.findUnique({
    where: { username: decodeURIComponent(username) },
    ...userProfileQuery
  });

  // Eğer kullanıcı bulunamazsa null dön.
  if (!user) {
    return null;
  }

  // Kullanıcı bulunduktan sonra, demolarına gelen beğeni sayısını ayrı bir sorgu ile hesapla.
  const totalDemoLikes = await prisma.interaction.count({
    where: {
      type: InteractionType.LIKE, // Doğru enum kullanımı
      targetType: 'USER_DEMO',
      // Beğenilen demoların yazarının bu kullanıcı olduğunu belirt.
      userDemo: {
        authorId: user.id
      }
    }
  });
  
  // Hesaplanan sayıyı ana kullanıcı objesine ekleyerek döndür.
  return { ...user, totalDemoLikes };
}


// 4. Metadata Fonksiyonu (Değişiklik yok, ama doğru çalışması için üstteki fonksiyonun düzelmesi gerekiyordu)
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const user = await getUserProfile(params.username);
  if (!user) {
    return { title: 'Kullanıcı Bulunamadı | Dublio' };
  }
  return {
    title: `${user.username} | Dublio Kullanıcı Profili`,
    description: user.bio || `${user.username} kullanıcısının Dublio'daki profili.`,
  };
}


// 5. Ana Sayfa Bileşeni (Sunucu - Değişiklik yok)
export default async function UserProfilePageServer({ params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);
  const user = await getUserProfile(params.username);

  if (!user) {
    notFound();
  }
  
  const isViewingOwnProfile = session?.user?.username === user.username;

  return (
    <UserProfileContent 
      user={user} 
      isViewingOwnProfile={isViewingOwnProfile} 
    />
  );
}