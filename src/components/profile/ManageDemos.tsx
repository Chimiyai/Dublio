//src/components/profile/ManageDemos.tsx
'use client';

import { useState, FC, ChangeEvent } from 'react';
import { UserDemo, DemoType, DemoCategory, Content, Skill } from '@prisma/client';
import { toast } from 'react-hot-toast';

interface ManageDemosProps {
  demos: UserDemo[];
  userSkills: { skill: Skill }[]; // Kullanıcının sahip olduğu yetenekler
  demoCategories: DemoCategory[];
  allContents: { id: number; title: string; }[];
  onDemosUpdate: (updatedDemos: UserDemo[]) => void;
}

const ManageDemos: FC<ManageDemosProps> = ({ demos, userSkills, demoCategories, allContents, onDemosUpdate }) => {
  // Form state'leri
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DemoType>('AUDIO');
  
  // Yeni state'ler
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedContentId, setSelectedContentId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    try {
      const data = new FormData();
      data.set('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Dosya yüklenemedi.');
      const { url } = await res.json();
      return url;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading('Demo oluşturuluyor...');

    const uploadedUrl = await uploadFile();
    if (!uploadedUrl) {
      setIsLoading(false);
      toast.dismiss();
      return;
    }

    try {
      const response = await fetch('/api/profile/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, type, url: uploadedUrl,
          // API'ye yeni verileri de gönderiyoruz (henüz API bunu işlemiyor, sonraki adım)
          // categoryId: parseInt(selectedCategoryId),
          // skillId: parseInt(selectedSkillId),
          // contentId: parseInt(selectedContentId),
        }),
      });
      const newDemo = await response.json();
      toast.dismiss();

      if (!response.ok) throw new Error(newDemo.message || 'Hata');
      
      toast.success('Demo başarıyla eklendi!');
      onDemosUpdate([newDemo, ...demos]);
      // Formu sıfırla
      setTitle(''); setDescription(''); setFile(null);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (demoId: number) => {
    if(!window.confirm("Bu demoyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) return;
    
    toast.loading('Demo siliniyor...');
    try {
      const response = await fetch('/api/profile/demos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId }),
      });
      const result = await response.json();
      toast.dismiss();

      if (!response.ok) throw new Error(result.message);
      
      toast.success('Demo silindi.');
      onDemosUpdate(demos.filter(d => d.id !== demoId));

    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };


  return (
    <div>
      {/* Yeni Demo Ekleme Formu */}
      <form onSubmit={handleSubmit} style={{ background: '#2a2a2a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4>Yeni Demo Ekle</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Başlık" value={title} onChange={e => setTitle(e.target.value)} required />
          <textarea placeholder="Açıklama" value={description} onChange={e => setDescription(e.target.value)} />
          <select value={type} onChange={e => setType(e.target.value as DemoType)}>
            <option value="AUDIO">Ses</option> <option value="VIDEO">Video</option> <option value="IMAGE">Görsel</option>
          </select>
          {/* Yeni Dropdown'lar */}
          <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}>
            <option value="">Demo Kategorisi Seç</option>
            {demoCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}>
            <option value="">Sergilenen Yetenek Seç</option>
            {userSkills.map(s => <option key={s.skill.id} value={s.skill.id}>{s.skill.name}</option>)}
          </select>
           <select value={selectedContentId} onChange={e => setSelectedContentId(e.target.value)}>
            <option value="">İlgili İçerik (opsiyonel)</option>
            {allContents.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          
          <input type="file" onChange={handleFileChange} required />
          <button type="submit" disabled={isLoading}>{isLoading ? 'Kaydediliyor...' : 'Demoyu Ekle'}</button>
        </div>
      </form>
      {/* Mevcut demolar listesi aynı */}
    </div>
  );
};

export default ManageDemos;