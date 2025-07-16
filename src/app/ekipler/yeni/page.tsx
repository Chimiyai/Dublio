//src/app/ekipler/yeni/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function CreateTeamPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading('Ekip oluşturuluyor...');

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const newTeam = await response.json();
      toast.dismiss();

      if (!response.ok) {
        throw new Error(newTeam.message || 'Ekip oluşturulamadı.');
      }

      toast.success(`'${newTeam.name}' ekibi başarıyla oluşturuldu!`);
      // Ekip oluşturulduktan sonra ekibin profil sayfasına yönlendir.
      router.push(`/ekipler/${newTeam.slug}`);

    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', color: 'white', background: '#1c1c1c', padding: '20px' }}>
      <h1>Yeni Ekip Oluştur</h1>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>
        Kendi projenizi hayata geçirmek için ilk adımı atın ve ekibinizi kurun.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="name">Ekip Adı</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
          />
        </div>
        <div>
          <label htmlFor="description">Ekip Açıklaması (Manifesto)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
          />
        </div>
        <button type="submit" disabled={isLoading} style={{ padding: '10px', background: 'purple', color: 'white' }}>
          {isLoading ? 'Oluşturuluyor...' : 'Ekibi Oluştur'}
        </button>
      </form>
    </div>
  );
}