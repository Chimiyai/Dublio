// src/components/admin/ContentForm.tsx

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ContentType } from '@prisma/client';

// Düzenleme modu için prop'lar da ekleyebiliriz ama şimdilik sadece oluşturma.
interface Props {
  // Gelecekte düzenleme için:
  // content?: Content; 
}

export default function ContentForm({}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form alanları için state'ler
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<ContentType>(ContentType.GAME);
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Başlık yazıldıkça slug'ı otomatik oluştur
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Basit bir slugify mantığı
    setSlug(newTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !type) {
      return toast.error('Başlık, Slug ve Tür alanları zorunludur.');
    }

    setIsLoading(true);
    toast.loading('İçerik oluşturuluyor...');

    try {
      const response = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          type,
          description,
          coverImageUrl,
          bannerUrl,
        }),
      });

      const responseData = await response.json();
      toast.dismiss();

      if (!response.ok) {
        throw new Error(responseData.message || 'İçerik oluşturulamadı.');
      }

      toast.success(`"${responseData.title}" başarıyla oluşturuldu!`);
      router.push('/admin/icerikler'); // Admin içerik listesi sayfasına yönlendir
      router.refresh();

    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
      <div>
        <label htmlFor="title">Başlık</label>
        <input id="title" type="text" value={title} onChange={handleTitleChange} required />
      </div>

      <div>
        <label htmlFor="slug">URL Uzantısı (Slug)</label>
        <input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <small>Örn: cyberpunk-2077</small>
      </div>

      <div>
        <label htmlFor="type">İçerik Türü</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value as ContentType)}>
          {Object.values(ContentType).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description">Açıklama</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>

      <div>
        <label htmlFor="coverImageUrl">Kapak Resmi URL'si</label>
        <input id="coverImageUrl" type="url" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
      </div>

      <div>
        <label htmlFor="bannerUrl">Banner Resmi URL'si</label>
        <input id="bannerUrl" type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Oluşturuluyor...' : 'İçeriği Oluştur'}
      </button>
    </form>
  );
}

// Not: Stilleri Tailwind veya mevcut UI kütüphanenle güzelleştirebilirsin.