//src/components/teams/TeamProfileContent.tsx
'use client';

// Tipi sunucu dosyasından import ediyoruz
import { TeamWithProfile } from '@/app/ekipler/[slug]/page';
import Link from 'next/link';

interface Props {
  team: TeamWithProfile;
}

export default function TeamProfileContent({ team }: Props) {
  return (
    <div style={{ color: 'white', background: '#121212', padding: '20px' }}>
      {/* Ekip Banner ve Logo */}
      {team.bannerUrl && <img src={team.bannerUrl} alt={`${team.name} Banner`} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '-50px', paddingLeft: '20px' }}>
        {team.logoUrl && <img src={team.logoUrl} alt={`${team.name} Logo`} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #121212' }} />}
        <h1 style={{ marginLeft: '20px', fontSize: '2.5rem' }}>{team.name}</h1>
      </div>

      <hr style={{ margin: '30px 0' }} />

      {/* Ekip Bilgileri ve Üyeler */}
      <div style={{ display: 'flex', gap: '40px' }}>
        
        {/* Sol Taraf: Açıklama ve Projeler */}
        <div style={{ flex: 2 }}>
          <h3>Ekip Manifestosu</h3>
          <p style={{ color: '#ccc' }}>{team.description || 'Bu ekip henüz bir açıklama girmemiş.'}</p>
          
          <h3 style={{ marginTop: '30px' }}>Projeler ({team.projects.length})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {team.projects.length > 0 ? (
              team.projects.map(project => (
                <Link href={`/projeler/${project.id}`} key={project.id} style={{ textDecoration: 'none', color: 'white' }}>
                  <div style={{ width: '150px', background: '#222', padding: '10px', textAlign: 'center' }}>
                    {project.content.coverImageUrl && <img src={project.content.coverImageUrl} alt={project.content.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />}
                    <p style={{ marginTop: '5px' }}>{project.name}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p>Bu ekibin henüz herkese açık bir projesi yok.</p>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Üyeler */}
        <div style={{ flex: 1, borderLeft: '1px solid #444', paddingLeft: '40px' }}>
          <h3>Ekip Üyeleri ({team.members.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {team.members.map(member => (
              <li key={member.user.username} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <Link href={`/profil/${member.user.username}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'white' }}>
                  <img 
                    src={member.user.profileImage || `https://ui-avatars.com/api/?name=${member.user.username}&background=random`} 
                    alt={member.user.username} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }} 
                  />
                  <span>
                    {member.user.username}
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#aaa' }}>{member.role}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

       {/* Ham Veri Dökümü (Debug için) */}
       <div style={{marginTop: '40px'}}>
        <h3>Ham Ekip Verisi (Debug için)</h3>
        <pre style={{ background: '#222', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(team, null, 2)}
        </pre>
       </div>
    </div>
  );
}