// src/components/projects/MarkAsReadyButton.tsx (Yeni Dosya)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Props {
  projectId: number;
}

export function MarkAsReadyButton({ projectId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!confirm("Tüm asset ve karakter atamalarını tamamladığınızdan emin misiniz? Bu işlem projeyi çeviriye açacak ve geri alınamaz.")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/ready-for-translation`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'İşlem başarısız oldu.');
      }
      
      toast.success('Proje çeviriye açıldı!');
      router.refresh(); // Sayfayı yenileyerek güncel durumu göster
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'İşleniyor...' : 'Projeyi Çeviriye Hazır Olarak İşaretle'}
    </button>
  );
}