//src/app/ekipler/page.tsx
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import TeamList from '@/components/teams/TeamList'; // Yeni oluşturacağımız istemci bileşeni
import Link from 'next/link';

// 1. Ekip kartları için gerekli veri yapısını tanımlıyoruz
const teamCardQuery = {
  select: {
    id: true,
    name: true,
    slug: true,
    logoUrl: true,
    motto: true,
    // İlişkili modellerden veri sayma (_count)
    _count: {
      select: {
        members: true, // Üye sayısını al
        projects: true, // Proje sayısını al
      },
    },
  },
};

// 2. Tipi export ediyoruz
export type TeamCardData = Prisma.TeamGetPayload<typeof teamCardQuery>;


// 3. Veri çekme fonksiyonu
async function getAllTeams(): Promise<TeamCardData[]> {
  const teams = await prisma.team.findMany({
    ...teamCardQuery,
    orderBy: {
      createdAt: 'desc', // En yeni ekipler en üstte
    },
  });
  return teams;
}


// 4. Ana Sayfa Bileşeni (Sunucu)
export default async function TeamsDirectoryPage() {
  const teams = await getAllTeams();

  return (
    <div style={{ maxWidth: '1200px', margin: '50px auto', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Ekipler Dizini</h1>
        <Link href="/ekipler/yeni" style={{ padding: '10px 20px', background: 'purple', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Yeni Ekip Oluştur
        </Link>
      </div>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>
        Platformdaki yaratıcı ekipleri keşfet ve projelerine göz at.
      </p>
      
      {/* Veriyi listeleyecek olan istemci bileşenini çağırıyoruz */}
      <TeamList teams={teams} />
    </div>
  );
}