// src/app/icerikler/page.tsx

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import ContentCard from '@/components/contents/ContentCard';
// DÜZELTME: Prisma'nın ürettiği tam tipi import edelim
import { type Content, type Prisma } from '@prisma/client';

// `ContentCard`'ın beklediği tipi burada da tanımlayalım veya import edelim.
// Bu, `Content` ve `_count` alanlarını birleştiren bir tiptir.
type ContentWithProjectCount = Prisma.ContentGetPayload<{
    include: {
        _count: {
            select: { projects: true }
        }
    }
}>;


// Veritabanından tüm içerikleri çeken fonksiyon
async function getContents(): Promise<ContentWithProjectCount[]> {
  const contents = await prisma.content.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    // === ÇÖZÜM BURADA: `include` bloğunu ekliyoruz ===
    // Her bir content için, ilişkili olduğu projelerin sayısını da çekiyoruz.
    include: {
        _count: {
            select: { projects: true }
        }
    }
  });
  return contents;
}


export default async function ContentsPage() {
  const [contents, session] = await Promise.all([
      getContents(),
      getServerSession(authOptions)
  ]);

  const leaderOfTeams = session?.user?.id 
    ? await prisma.team.findMany({
        where: { members: { some: { userId: parseInt(session.user.id), role: 'LEADER' } } },
        select: { id: true, name: true }
      })
    : [];

  const canPropose = leaderOfTeams.length > 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', color: 'white' }}>
      <h1>Yerelleştirme Fırsatları</h1>
      <p style={{ color: '#aaa', marginBottom: '40px' }}>
        Aşağıda, Dublio topluluğu tarafından yerelleştirilmeyi bekleyen oyun, anime ve mangaları bulabilirsiniz.
        Bir ekip lideriyseniz, projelere talip olabilirsiniz.
      </p>

      {contents.length === 0 ? (
        <p>Şu anda yerelleştirilmeyi bekleyen bir içerik bulunmuyor.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {contents.map(content => (
            // Artık 'content' objesi '_count' alanını içerdiği için hata vermeyecek.
            <ContentCard 
              key={content.id} 
              content={content} 
              canPropose={canPropose} 
            />
          ))}
        </div>
      )}
    </div>
  );
}