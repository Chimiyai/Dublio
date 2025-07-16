//src/app/ekipler/[slug]/studyosu/projeler/[projectId]/dublaj/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TranslationStatus } from '@prisma/client';
import DubbingStudioClient from '@/components/projects/DubbingStudioClient';
// Yeni tipimizi import ediyoruz
import { LineForDubbing } from '@/types/dubbing';

// getLinesForDubbing fonksiyonunun dönüş tipini yeni tipimizle değiştiriyoruz.
async function getLinesForDubbing(projectId: number): Promise<LineForDubbing[]> {
  const lines = await prisma.translationLine.findMany({
    where: {
      asset: { projectId: projectId },
      status: TranslationStatus.APPROVED, 
    },
    orderBy: { key: 'asc' }
    // === DİKKAT: select bloğunu tamamen siliyoruz ===
    // Prisma'nın varsayılan olarak TranslationLine'ın tüm skaler alanlarını getirmesine izin veriyoruz.
    // Bu, voiceRecordingUrl'i de getirecektir.
    // ===============================================
  });
  return lines;
}

export default async function DubbingStudioPage({ params }: { params: { projectId: string } }) {
    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) return notFound();
    
    const linesForDubbing = await getLinesForDubbing(projectId);

    return (
        <div>
            <h1>Dublaj Atölyesi</h1>
            <p>
                Aşağıda, seslendirmeniz için onaylanmış replikler listelenmektedir.
                Her replik için "Kayıt Başlat" butonuna basarak kaydınızı yapabilirsiniz.
            </p>
            <hr style={{margin: '20px 0'}} />

            {linesForDubbing.length > 0 ? (
                <DubbingStudioClient lines={linesForDubbing} />
            ) : (
                <p style={{color: 'gray', fontStyle: 'italic'}}>
                    Seslendirme için hazır (onaylanmış) bir replik bulunmuyor.
                </p>
            )}
        </div>
    );
}