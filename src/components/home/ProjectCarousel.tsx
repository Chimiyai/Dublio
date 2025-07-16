//src/components/home/ProjectCarousel.tsx
'use client';
import { ProjectForCard } from '@/app/page';
import Link from 'next/link';

interface Props {
  title: string;
  projects: ProjectForCard[];
}

export default function ProjectCarousel({ title, projects }: Props) {
  if (projects.length === 0) return null;

  return (
    <section style={{ padding: '40px 20px' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>{title}</h2>
      <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
        {projects.map(project => (
          <Link href={`/projeler/${project.id}`} key={project.id} style={{ flex: '0 0 180px', textDecoration: 'none', color: 'white' }}>
            <div style={{ background: '#1c1c1c' }}>
              <img src={project.content.coverImageUrl || ''} alt={project.content.title} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
              <div style={{ padding: '10px' }}>
                <h3 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.content.title}</h3>
                <p style={{ margin: '5px 0 0', color: '#aaa', fontSize: '0.9rem' }}>{project.team.name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}