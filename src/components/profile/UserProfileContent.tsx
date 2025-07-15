// src/components/profile/UserProfileContent.tsx
'use client';

// Yeni tipleri import ediyoruz
import { UserWithProfile } from '@/app/profil/[username]/page';
import Link from 'next/link';

// Props arayüzümüz
interface Props {
  user: UserWithProfile;
  isViewingOwnProfile: boolean;
}

// Bileşenimiz
export default function UserProfileContent({ user, isViewingOwnProfile }: Props) {
  return (
    <div style={{ fontFamily: 'sans-serif', color: '#eee', background: '#121212', padding: '20px' }}>
      {isViewingOwnProfile && (
        <div style={{ background: 'blue', color: 'white', padding: '10px', marginBottom: '20px' }}>
          Bu sizin kendi profiliniz. <a href="/profil" style={{ color: 'yellow' }}>Profili Düzenle</a>
        </div>
      )}

      <h1>Kullanıcı Profili: {user.username}</h1>
      <hr />

      {/* ... (Temel bilgiler, yetenekler, demolar, ekipler - önceki mesajdaki gibi) ... */}
      <p>Biyografi: {user.bio || 'Biyografi belirtilmemiş.'}</p>

      <h3>Yetenekler</h3>
      {user.skills.length > 0 ? (
        <ul>
          {user.skills.map(skill => <li key={skill.skillName}>{skill.skillName}</li>)}
        </ul>
      ) : <p>Yetenek yok.</p>}

      <h3>Portfolyo / Demolar</h3>
      {user.demos.length > 0 ? (
        user.demos.map(demo => (
          <div key={demo.id} style={{ border: '1px solid #555', padding: '10px', margin: '10px 0' }}>
            <h4>{demo.title}</h4>
            <p>Tür: {demo.type}</p>
            <a href={demo.url} target="_blank" rel="noopener noreferrer">Görüntüle</a>
            {/* Buraya demo için InteractionButtons eklenebilir */}
            {/* <InteractionButtons targetId={demo.id} targetType="USER_DEMO" ... /> */}
          </div>
        ))
      ) : <p>Portfolyo boş.</p>}
      
      <h3>Üyesi Olduğu Ekipler</h3>
      {user.teamMemberships.length > 0 ? (
        <ul>
          {user.teamMemberships.map(m => (
            <li key={m.team.slug}>
              <Link href={`/ekipler/${m.team.slug}`}>{m.team.name} ({m.role})</Link>
            </li>
          ))}
        </ul>
      ) : <p>Herhangi bir ekibe üye değil.</p>}


      <hr />
      <h3>Ham Veri (Debug)</h3>
      <pre style={{ background: '#222', padding: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}