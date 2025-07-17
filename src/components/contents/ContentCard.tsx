// src/components/contents/ContentCard.tsx

import Link from 'next/link';
import { Content, Prisma } from '@prisma/client';

// `_count` alanını da içeren yeni bir tip oluşturalım.
type ContentWithCount = Content & {
    _count: {
        projects: number;
    }
};

interface Props {
  content: ContentWithCount;
  canPropose: boolean; // Kullanıcı teklif yapabilir mi?
}

export default function ContentCard({ content, canPropose }: Props) {
  // Basit bir stil objesi, Tailwind vs. ile güzelleştirilebilir.
  const cardStyle: React.CSSProperties = {
    background: '#1c1c1c',
    borderRadius: '8px',
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #333'
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '180px',
    objectFit: 'cover'
  };

  const contentStyle: React.CSSProperties = {
    padding: '15px'
  };
  
  const buttonStyle: React.CSSProperties = {
      display: 'inline-block',
      marginTop: '15px',
      padding: '8px 15px',
      background: 'purple',
      color: 'white',
      borderRadius: '5px',
      textAlign: 'center',
      fontWeight: 'bold'
  };

  return (
    <div style={cardStyle}>
      <img 
        src={content.coverImageUrl || '/images/default-cover.png'} 
        alt={`${content.title} kapak resmi`}
        style={imageStyle}
      />
      <div style={contentStyle}>
        <span style={{ background: '#555', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
          {content.type}
        </span>
        <h3 style={{ marginTop: '10px', fontSize: '1.2rem' }}>{content.title}</h3>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>
          {content._count.projects > 0 
            ? `${content._count.projects} ekip bu projeyle ilgileniyor.`
            : "İlk talip sen ol!"
          }
        </p>

        {/* "Talip Ol" butonu, sadece yetkisi olanlara görünecek */}
        {canPropose && (
            <Link href={`/teklif-ver/${content.slug}`} style={buttonStyle}>
                Projeye Talip Ol
            </Link>
        )}
      </div>
    </div>
  );
}