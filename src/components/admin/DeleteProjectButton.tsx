'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline'; // İkon için

interface DeleteProjectButtonProps {
  projectSlug: string;
  projectTitle: string;
}

export default function DeleteProjectButton({ projectSlug, projectTitle }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    // Kullanıcıdan onay al
    if (!window.confirm(`"${projectTitle}" adlı projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/projeler/${projectSlug}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Proje silinemedi.');
      }

      alert(data.message || 'Proje başarıyla silindi.'); // Basit bir bildirim
      router.refresh(); // Sayfayı yenileyerek listeden silinen projeyi kaldır
    } catch (err: any) {
      setError(err.message);
      alert(`Hata: ${err.message}`); // Hata bildirimi
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors duration-150 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Projeyi Sil"
      >
        {isDeleting ? 'Siliniyor...' : <TrashIcon className="h-5 w-5" />}
        {/* Veya sadece "Sil" metni: {isDeleting ? 'Siliniyor...' : 'Sil'} */}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </>
  );
}