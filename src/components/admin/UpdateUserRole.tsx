'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

interface UpdateUserRoleProps {
  userId: number; // Prisma'dan gelen ID (number)
  currentRole: 'user' | 'admin';
  username: string;
  isCurrentUserAdmin: boolean; // Değiştirilmeye çalışılan kullanıcının mevcut admin olup olmadığını kontrol etmek için
}

export default function UpdateUserRole({ userId, currentRole, username, isCurrentUserAdmin }: UpdateUserRoleProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>(currentRole);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Prop'tan gelen currentRole değişirse, dropdown'daki seçili değeri de güncelle
  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value as 'user' | 'admin');
    setError(null); // Yeni bir seçim yapıldığında eski hataları temizle
    setSuccessMessage(null); // Ve eski başarı mesajlarını
  };

  const handleSubmit = async () => {
    // Eğer seçilen rol mevcut rolle aynıysa veya admin kendi rolünü değiştirmeye çalışıyorsa işlem yapma
    if (selectedRole === currentRole) {
      setError('Yeni rol, mevcut rolle aynı. Değişiklik yapılmadı.');
      return;
    }
    if (isCurrentUserAdmin) {
      // Bu durum zaten butonun disabled olmasıyla engelleniyor ama ek bir güvence
      setError('Admin kendi rolünü değiştiremez.');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: selectedRole }),
        });

        const data = await response.json();

        if (!response.ok) {
          // API'den gelen Zod hata mesajlarını veya genel mesajı göster
          const errorMessage = data.errors?.role?.[0] || data.message || 'Rol güncellenirken bir hata oluştu.';
          setError(errorMessage);
          return;
        }

        setSuccessMessage(data.message || 'Kullanıcının rolü başarıyla güncellendi.');
        router.refresh(); // Sayfayı yenileyerek kullanıcı listesini ve rollerini güncelle
        // Başarı mesajı refresh sonrası kaybolabilir, daha kalıcı bir çözüm için toast notification düşünülebilir.
      } catch (err) {
        console.error('Rol güncelleme işlemi sırasında network hatası veya JSON parse hatası:', err);
        setError('Bir ağ hatası oluştu veya sunucudan geçersiz yanıt alındı.');
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
      <select
        value={selectedRole}
        onChange={handleRoleChange}
        disabled={isPending || isCurrentUserAdmin}
        className={`p-1 border rounded text-sm w-full sm:w-auto
          ${isCurrentUserAdmin ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
        title={isCurrentUserAdmin ? "Admin kendi rolünü değiştiremez" : `"${username}" kullanıcısının rolünü değiştir`}
      >
        <option value="user">Kullanıcı</option>
        <option value="admin">Admin</option>
      </select>
      <button
        onClick={handleSubmit}
        disabled={isPending || isCurrentUserAdmin || selectedRole === currentRole}
        className={`px-3 py-1 text-sm font-medium rounded text-white transition-colors w-full sm:w-auto
          ${(isCurrentUserAdmin || selectedRole === currentRole)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-60'
          }`}
      >
        {isPending ? 'Güncelleniyor...' : 'Rolü Güncelle'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1 w-full text-center sm:text-left">{error}</p>}
      {successMessage && <p className="text-green-600 text-xs mt-1 w-full text-center sm:text-left">{successMessage}</p>}
    </div>
  );
}