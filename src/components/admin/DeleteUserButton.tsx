'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline'; // İkon için

interface DeleteUserButtonProps {
  userId: number; // Prisma'dan gelen ID (number)
  username: string;
  isCurrentUserAdmin: boolean; // Silinmeye çalışılan kullanıcının mevcut admin olup olmadığını kontrol etmek için
                               // (Opsiyonel: API zaten bunu kontrol ediyor ama UI'da butonu disable edebiliriz)
}

export default function DeleteUserButton({ userId, username, isCurrentUserAdmin }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    // Adminin kendi hesabını silme butonu zaten disable edilecek (veya gösterilmeyecek)
    // ama bir client-side kontrol daha ekleyebiliriz.
    // Ancak ana kontrol backend'de olduğu için burası opsiyonel.

    const confirmed = confirm(`'${username}' adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`);
    if (!confirmed) {
      return;
    }

    setError(null); // Önceki hataları temizle

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Kullanıcı silinirken bir hata oluştu.');
          return;
        }

        alert(data.message || 'Kullanıcı başarıyla silindi.');
        router.refresh(); // Sayfayı yenileyerek kullanıcı listesini güncelle
      } catch (err) {
        console.error('Silme işlemi sırasında network hatası veya JSON parse hatası:', err);
        setError('Bir ağ hatası oluştu veya sunucudan geçersiz yanıt alındı.');
      }
    });
  };

  // Eğer silinmeye çalışılan kullanıcı mevcut admin ise butonu gösterme veya disable et
  // API zaten session.user.id === params.userId kontrolü yapıyor.
  // Burada sadece UI deneyimi için ek bir kontrol.
  // Adminin kendi ID'si ile silinecek kullanıcının ID'si aynıysa butonu render etme
  // veya disabled yap (şimdilik render etmeyelim).
  // Bu isCurrentUserAdmin prop'unu page.tsx'den doğru şekilde almamız lazım.

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending || isCurrentUserAdmin} // Admin kendini silemesin ve işlem sırasında buton pasif olsun
        className={`p-1 rounded text-sm transition-colors
          ${isCurrentUserAdmin
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-500 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-wait'
          }`}
        title={isCurrentUserAdmin ? "Admin kendi hesabını silemez" : `"${username}" kullanıcısını sil`}
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