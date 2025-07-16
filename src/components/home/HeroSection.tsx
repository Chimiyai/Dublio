// src/components/home/HeroSection.tsx
'use client';
import { ProjectForCard } from '@/app/page'; // Tipleri import et
import Link from 'next/link';

interface Props {
  project: ProjectForCard | null;
}

export default function HeroSection({ project }: Props) {
  if (!project) {
    return (
      <section style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1c1c' }}>
        <div>
          <h1 style={{ fontSize: '3rem' }}>Yaratıcı İş Birliği Ekosistemi</h1>
          <p>Dublio'ya hoş geldiniz.</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ height: '70vh', position: 'relative', color: 'white' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, #101014, transparent 50%)' }} />
      <img src={project.content.coverImageUrl || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px) brightness(0.5)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', textShadow: '2px 2px 8px #000' }}>{project.content.title}</h1>
        <p>"{project.team.name}" tarafından hayata geçirildi.</p>
        <Link href={`/projeler/${project.id}`} style={{ padding: '10px 20px', background: 'purple', textDecoration: 'none', color: 'white', marginTop: '20px', display: 'inline-block' }}>
          Projeyi İncele
        </Link>
      </div>
    </section>
  );
}