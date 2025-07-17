// src/components/admin/EditProjectForm.tsx

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Content, Team, ProjectStatus } from '@prisma/client';

// Dışarıdan gelecek proje verisinin tipini import ediyoruz.
// Bu, `.../duzenle/[projectId]/page.tsx` dosyasında export ettiğimiz tiptir.
import { type ProjectForAdmin } from '@/app/admin/projeler/duzenle/[projectId]/page';

// Component'in alacağı prop'ların arayüzü
interface Props {
  isEditing: boolean;
  project?: ProjectForAdmin; // Düzenleme modunda zorunlu, yeni oluşturmada undefined
  allContents: Content[];
  allTeams: Team[];
}

export default function EditProjectForm({ isEditing, project, allContents, allTeams }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // === FORM STATE'LERİ ===
  // Düzenleme modundaysa mevcut verilerle, değilse boş değerlerle başlat.
  const [name, setName] = useState(project?.name || '');
  const [selectedContentId, setSelectedContentId] = useState<string>(project?.contentId?.toString() || '');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(project?.teamId?.toString() || '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || ProjectStatus.RECRUITING);
  const [isPublic, setIsPublic] = useState(project?.isPublic ?? true);

  // Proje adı, ilişkili içeriğe göre otomatik olarak doldurulabilir
  useEffect(() => {
    if (!isEditing && selectedContentId) {
      const selectedContent = allContents.find(c => c.id === parseInt(selectedContentId));
      if (selectedContent) {
        setName(`${selectedContent.title} - Türkçe Yerelleştirme Projesi`);
      }
    }
  }, [selectedContentId, isEditing, allContents]);

  // === FORM GÖNDERME MANTIĞI ===
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !selectedContentId || !selectedTeamId) {
      return toast.error("Tüm zorunlu alanları doldurun.");
    }
    
    setIsLoading(true);
    toast.loading(isEditing ? "Proje güncelleniyor..." : "Proje oluşturuluyor...");

    const body = {
      name,
      contentId: parseInt(selectedContentId),
      teamId: parseInt(selectedTeamId),
      status,
      isPublic,
    };

    // Düzenleme modundaysa PUT, değilse POST isteği at
    const url = isEditing ? `/api/projects/${project?.id}` : '/api/projects';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();
      toast.dismiss();

      if (!response.ok) {
        throw new Error(responseData.message || "Bir hata oluştu.");
      }
      
      toast.success(isEditing ? "Proje başarıyla güncellendi!" : "Proje başarıyla oluşturuldu!");
      
      // İşlem sonrası yönlendirme
      router.push('/admin/projeler');
      router.refresh(); // Sunucu tarafındaki verilerin yenilenmesini tetikle

    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // === RENDER ===
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Proje Adı */}
      <div>
        <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Proje Adı</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
        />
      </div>

      {/* İçerik Seçimi */}
      <div>
        <label htmlFor="content" style={{ display: 'block', marginBottom: '5px' }}>İlişkili İçerik (Oyun/Anime)</label>
        <select
          id="content"
          value={selectedContentId}
          onChange={(e) => setSelectedContentId(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
        >
          <option value="" disabled>-- İçerik Seçin --</option>
          {allContents.map(content => (
            <option key={content.id} value={content.id}>{content.title}</option>
          ))}
        </select>
      </div>

      {/* Ekip Seçimi */}
      <div>
        <label htmlFor="team" style={{ display: 'block', marginBottom: '5px' }}>Sorumlu Ekip</label>
        <select
          id="team"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
        >
           <option value="" disabled>-- Ekip Seçin --</option>
           {allTeams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>

      {/* Proje Durumu */}
      <div>
        <label htmlFor="status" style={{ display: 'block', marginBottom: '5px' }}>Proje Durumu</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
        >
          {Object.values(ProjectStatus).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Herkese Açık mı? */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
         <input
          id="isPublic"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          style={{ width: '20px', height: '20px' }}
        />
        <label htmlFor="isPublic">Proje Herkese Açık Olarak Listelensin mi?</label>
      </div>

      {/* Gönder Butonu */}
      <button type="submit" disabled={isLoading} style={{ padding: '12px', background: 'purple', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
        {isLoading ? 'Kaydediliyor...' : (isEditing ? 'Değişiklikleri Kaydet' : 'Projeyi Oluştur')}
      </button>
    </form>
  );
}