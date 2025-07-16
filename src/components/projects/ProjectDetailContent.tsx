// src/components/projects/ProjectDetailContent.tsx
'use client';

import { useMemo } from 'react';
// Tipleri sunucu dosyasından import ediyoruz.
import { ProjectWithDetails, UserInteractionData } from '@/app/projeler/[projectId]/page';
// Yeni etkileşim butonlarımızı import ediyoruz.
import InteractionButtons from '@/components/shared/InteractionButtons';

// Props arayüzümüz.
interface Props {
  project: ProjectWithDetails;
  userInteraction: UserInteractionData;
}

// Bileşenimiz.
export default function ProjectDetailContent({ project, userInteraction }: Props) {
  
  // Gerekli verileri project objesinden çıkarıyoruz.
  const { content, team } = project;

  // Beğeni ve favori sayılarını anlık olarak hesaplıyoruz.
  const likeCount = useMemo(() => {
    return project.interactions.filter(interaction => interaction.type === 'LIKE').length;
  }, [project.interactions]);

  const favoriteCount = useMemo(() => {
    return project.interactions.filter(interaction => interaction.type === 'FAVORITE').length;
  }, [project.interactions]);

  return (
    <div>
      <h1>Proje Detay Sayfası (Sade Görünüm)</h1>
      <hr />

      {/* Ana Proje ve İçerik Bilgileri */}
      <h2>Proje Adı: {project.name}</h2>
      <h3>İçerik Adı: {content.title}</h3>
      <p>Ekip: {team.name}</p>
      <p>Açıklama: {content.description || 'Açıklama yok.'}</p>
      <p>Durum: {project.status}</p>
      
      {content.bannerUrl && <img src={content.bannerUrl} alt="Banner" style={{ maxWidth: '500px' }} />}
      <br />
      {content.coverImageUrl && <img src={content.coverImageUrl} alt="Kapak Resmi" style={{ maxWidth: '200px' }} />}
      
      <hr />

      {/* Etkileşim Bölümü */}
      <h3>Etkileşimler</h3>
      <div>
        <InteractionButtons
          targetId={project.id}
          targetType="PROJECT"
          initialLikeCount={likeCount}
          initialFavoriteCount={favoriteCount}
          userInitialInteraction={{
            liked: userInteraction.liked,
            favorited: userInteraction.favorited
          }}
          isUserLoggedIn={userInteraction.isLoggedIn}
        />
      </div>
      <p>Toplam Beğeni: {likeCount}</p>
      <p>Toplam Favori: {favoriteCount}</p>
      
      <hr />

      {/* Ham Veri Dökümü (Hata ayıklama için çok yararlıdır) */}
      <h3>Ham Proje Verisi (Debug için)</h3>
      <pre style={{ background: '#222', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(project, null, 2)}
      </pre>

      <h3>Ham Kullanıcı Etkileşim Verisi (Debug için)</h3>
      <pre style={{ background: '#222', padding: '10px', borderRadius: '5px' }}>
        {JSON.stringify(userInteraction, null, 2)}
      </pre>
    </div>
  );
}