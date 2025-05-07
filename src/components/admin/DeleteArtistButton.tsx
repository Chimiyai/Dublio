'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteArtistButtonProps {
  artistId: number;
  artistFullName: string; // Onay mesajında göstermek için
}

export default function DeleteArtistButton({ artistId, artistFullName }: DeleteArtistButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const confirmed = confirm(`'${artistFullName}' adlı sanatçıyı silmek istediğinizden emin misiniz? Bu sanatçıya ait tüm proje atamaları da silinecektir (eğer varsa). Bu işlem geri alınamaz.`);
    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/sanatcilar/${artistId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Sanatçı silinirken bir hata oluştu.');
          return;
        }

        alert(data.message || 'Sanatçı başarıyla silindi.');
        router.refresh(); // Sayfayı yenileyerek sanatçı listesini güncelle
      } catch (err) {
        console.error('Sanatçı silme işlemi sırasında hata:', err);
        setError('Bir ağ hatası oluştu veya sunucudan geçersiz yanıt alındı.');
      }
    });
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={`p-1 rounded text-sm transition-colors
          bg-red-500 hover:bg-red-700 text-white 
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 
          disabled:opacity-50 disabled:cursor-wait`}
        title={`"${artistFullName}" sanatçısını sil`}
      >
        {isPending ? (
          <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <TrashIcon className="h-5 w-5" />
        )}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </>
  );
}