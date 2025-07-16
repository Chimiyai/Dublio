//src/components/home/TalentShowcase.tsx
'use client';
import { DemoForCard } from '@/app/page';
import Link from 'next/link';

interface Props {
  title: string;
  demos: DemoForCard[];
}

export default function TalentShowcase({ title, demos }: Props) {
  if (demos.length === 0) return null;

  return (
    <section style={{ padding: '40px 20px', background: '#1c1c1c' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {demos.map(demo => (
          <div key={demo.id} style={{ background: '#2a2a2a', padding: '15px' }}>
            <p><strong>{demo.title}</strong></p>
            <p>"{demo.description}"</p>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
              <img src={demo.author.profileImage || `https://ui-avatars.com/api/?name=${demo.author.username}`} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }} />
              <Link href={`/profil/${demo.author.username}`} style={{ color: 'purple' }}>
                {demo.author.username}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}