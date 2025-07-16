//src/app/ekipler/[slug]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import TeamProfileContent from '@/components/teams/TeamProfileContent'; // Yeni oluşturacağımız istemci bileşeni
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// 1. Ekip profili için veri yapımızı tanımlıyoruz
const teamProfileQuery = {
  include: {
    owner: { // Ekip sahibinin sadece kullanıcı adını alalım
      select: { username: true }
    },
    members: { // Üyeleri ve rollerini alalım
      include: {
        user: { select: { username: true, profileImage: true } } // Üyenin temel bilgileri
      },
      orderBy: { role: 'asc' } as const // Liderler en üstte görünsün
    },
    projects: { // Ekibin projelerini alalım
      include: {
        content: { select: { title: true, coverImageUrl: true } } // Projenin ana içerik bilgileri
      },
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' } as const
    },
  }
};

// 2. Tipi export ediyoruz
export type TeamWithProfile = Prisma.TeamGetPayload<typeof teamProfileQuery>;


// 3. Veri çekme fonksiyonu
async function getTeamProfile(slug: string): Promise<TeamWithProfile | null> {
  const team = await prisma.team.findUnique({
    where: { slug: decodeURIComponent(slug) },
    ...teamProfileQuery
  });
  return team;
}


// 4. Ana Sayfa Bileşeni (Sunucu)
export default async function TeamProfilePageServer({ params }: { params: { slug:string } }) {
  const { slug } = params; // Parametreyi başta al
  const team = await getTeamProfile(slug); // Fonksiyona değişkeni gönder

  if (!team) notFound();
  
  // YENİ: Oturum açmış kullanıcının bu ekipteki rolünü bulalım.
  const session = await getServerSession(authOptions);
  let viewerRole: string | null = null;
  if (session?.user?.id) {
    const userId = parseInt(session.user.id, 10);
    const membership = team.members.find(m => m.userId === userId);
    if(membership) {
        viewerRole = membership.role;
    }
  }

  return (
    <TeamProfileContent team={team} viewerRole={viewerRole} /> // <-- viewerRole'ü prop olarak ekle
  );
}
