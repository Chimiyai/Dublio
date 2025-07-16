//src/app/admin/icerikler/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Content, ContentType } from '@prisma/client';
import { toast } from 'react-hot-toast';

export default function ManageContentPage() {
    const [contents, setContents] = useState<Content[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Yeni içerik formu için state'ler
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [type, setType] = useState<ContentType>(ContentType.GAME);
    const [description, setDescription] = useState('');

    async function fetchContents() {
        try {
            const res = await fetch('/api/admin/contents');
            if (!res.ok) throw new Error("İçerikler yüklenemedi");
            const data = await res.json();
            setContents(data);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchContents();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        toast.loading('İçerik ekleniyor...');
        try {
            const res = await fetch('/api/admin/contents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, slug, type, description })
            });
            const newContent = await res.json();
            toast.dismiss();
            if (!res.ok) throw new Error(newContent.message || "İçerik eklenemedi");
            
            toast.success("İçerik başarıyla eklendi!");
            fetchContents(); // Listeyi yenile
            // Formu temizle
            setTitle(''); setSlug(''); setDescription('');
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
        }
    };

    if (isLoading) return <div>Yükleniyor...</div>;

    return (
        <div style={{ display: 'flex', gap: '50px', padding: '20px', color: 'white' }}>
            {/* Yeni İçerik Ekleme Formu */}
            <div style={{ flex: 1 }}>
                <h2>Yeni İçerik Ekle</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Başlık (örn: The Witcher 3)" required />
                    <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="URL (örn: the-witcher-3)" required />
                    <select value={type} onChange={e => setType(e.target.value as ContentType)}>
                        <option value="GAME">Oyun</option>
                        <option value="ANIME">Anime</option>
                        <option value="MANGA">Manga</option>
                    </select>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama" />
                    <button type="submit" style={{ background: 'purple' }}>Ekle</button>
                </form>
            </div>

            {/* Mevcut İçerikler Listesi */}
            <div style={{ flex: 2 }}>
                <h2>Mevcut İçerikler ({contents.length})</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #444', padding: '8px' }}>ID</th>
                            <th style={{ border: '1px solid #444', padding: '8px' }}>Başlık</th>
                            <th style={{ border: '1px solid #444', padding: '8px' }}>Tür</th>
                            <th style={{ border: '1px solid #444', padding: '8px' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contents.map(content => (
                            <tr key={content.id}>
                                <td style={{ border: '1px solid #444', padding: '8px' }}>{content.id}</td>
                                <td style={{ border: '1px solid #444', padding: '8px' }}>{content.title}</td>
                                <td style={{ border: '1px solid #444', padding: '8px' }}>{content.type}</td>
                                <td style={{ border: '1px solid #444', padding: '8px' }}>
                                    {/* Buraya Düzenle/Sil butonları gelecek */}
                                    Düzenle / Sil
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}