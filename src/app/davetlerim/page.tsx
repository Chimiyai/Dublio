//src/app/davetlerim/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Prisma, TeamInvitation } from '@prisma/client';

// API'den dönen verinin tam tipini oluşturalım
type InvitationWithDetails = TeamInvitation & {
  team: { name: string, logoUrl: string | null };
  inviter: { username: string };
};

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yüklendiğinde davetleri çek
  useEffect(() => {
    const fetchInvitations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/invitations');
        if (!response.ok) throw new Error('Davetler yüklenemedi.');
        const data = await response.json();
        setInvitations(data);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvitations();
  }, []);

  // Daveti yanıtlama fonksiyonu
  const handleResponse = async (invitationId: number, response: 'ACCEPTED' | 'DECLINED') => {
    // Butona tekrar basılmasını engellemek için ilgili daveti listeden kaldıralım
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

    try {
        const res = await fetch('/api/invitations', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invitationId, response }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success(data.message);
    } catch (error: any) {
        toast.error(error.message);
        // Hata durumunda daveti listeye geri ekleyebiliriz (opsiyonel)
    }
  };


  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', color: 'white' }}>
      <h1>Ekip Davetlerim</h1>
      {invitations.length === 0 ? (
        <p>Bekleyen bir davetiniz bulunmuyor.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {invitations.map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1c1c1c', padding: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img 
                  src={inv.team.logoUrl || `https://ui-avatars.com/api/?name=${inv.team.name}`} 
                  alt={`${inv.team.name} Logo`}
                  style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                />
                <div>
                  <p style={{ margin: 0 }}>
                    <strong>{inv.team.name}</strong> ekibi sizi davet ediyor.
                  </p>
                  <small style={{ color: '#aaa' }}>Davet eden: {inv.inviter.username}</small>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleResponse(inv.id, 'ACCEPTED')} style={{ background: 'green', color: 'white', padding: '8px 12px' }}>
                  Kabul Et
                </button>
                <button onClick={() => handleResponse(inv.id, 'DECLINED')} style={{ background: 'red', color: 'white', padding: '8px 12px' }}>
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}