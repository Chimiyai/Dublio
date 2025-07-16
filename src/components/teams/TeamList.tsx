//src/components/teams/TeamList.tsx
'use client';

import { TeamCardData } from '@/app/ekipler/page'; // Tipleri sunucu dosyasından import ediyoruz
import Link from 'next/link';

interface Props {
  teams: TeamCardData[];
}

export default function TeamList({ teams }: Props) {
  if (teams.length === 0) {
    return <p>Gösterilecek ekip bulunamadı. İlk ekibi sen kur!</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {teams.map((team) => (
        <Link href={`/ekipler/${team.slug}`} key={team.id} style={{ textDecoration: 'none', color: 'white' }}>
          <div style={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', padding: '20px', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <img 
                src={team.logoUrl || `https://ui-avatars.com/api/?name=${team.name}&background=random&color=fff`} 
                alt={`${team.name} Logo`}
                style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '15px' }}
              />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{team.name}</h2>
                {team.motto && <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#aaa' }}>"{team.motto}"</p>}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{team._count.members}</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa' }}>Üye</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{team._count.projects}</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#aaa' }}>Proje</p>
              </div>
            </div>

          </div>
        </Link>
      ))}
    </div>
  );
}