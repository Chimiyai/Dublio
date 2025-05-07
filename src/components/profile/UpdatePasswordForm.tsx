'use client';

import { useState, useTransition, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Belki gerekmez ama ekleyelim

interface FormErrors {
  currentPassword?: string[];
  newPassword?: string[];
  confirmPassword?: string[]; // Frontend kontrolü için
  general?: string;
}

export default function UpdatePasswordForm() {
  const router = useRouter(); // Şimdilik kullanılmıyor ama ileride gerekebilir
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    // Frontend Doğrulamaları
    let formValid = true;
    const newErrors: FormErrors = {};

    if (!currentPassword) {
        newErrors.currentPassword = ['Mevcut şifre boş bırakılamaz.'];
        formValid = false;
    }
    if (newPassword.length < 6) { // API ile aynı kural
        newErrors.newPassword = ['Yeni şifre en az 6 karakter olmalıdır.'];
        formValid = false;
    }
     if (newPassword.length > 50) { // API ile aynı kural
        newErrors.newPassword = [...(newErrors.newPassword || []), 'Yeni şifre en fazla 50 karakter olabilir.'];
        formValid = false;
    }
    if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = ['Yeni şifreler eşleşmiyor.'];
        formValid = false;
    }

    if (!formValid) {
        setErrors(newErrors);
        return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/profile/password', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
              currentPassword: currentPassword,
              newPassword: newPassword 
              // confirmPassword API'ye gönderilmiyor
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const serverErrors: FormErrors = {};
           if (data.errors) {
             for (const key in data.errors) {
                 if (Object.prototype.hasOwnProperty.call(data.errors, key)) {
                     serverErrors[key as keyof FormErrors] = data.errors[key];
                 }
             }
           }
           if(data.message && !Object.keys(serverErrors).length) {
               serverErrors.general = data.message;
           } else if (!Object.keys(serverErrors).length) {
                serverErrors.general = 'Şifre güncellenirken bilinmeyen bir hata oluştu.';
           }
           setErrors(serverErrors);
          return;
        }

        setSuccessMessage(data.message || 'Şifre başarıyla güncellendi!');
        // Başarı sonrası form alanlarını temizle
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Başarı mesajını birkaç saniye sonra temizle
        setTimeout(() => setSuccessMessage(null), 5000);

        // Sayfayı yenilemeye genellikle gerek yok, şifre değişimi arayüzü etkilemez.

      } catch (err) {
        console.error('Şifre güncelleme formu gönderim hatası:', err);
        setErrors({ general: 'Güncelleme sırasında bir ağ hatası oluştu.' });
      }
    });
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Şifreyi Güncelle</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && (
          <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300" role="alert">
            {successMessage}
          </div>
        )}
         {errors.general && (
           <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300" role="alert">
              {errors.general}
           </div>
        )}
        <div>
          <label htmlFor="currentPassword" aria-label="Mevcut Şifre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mevcut Şifre <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="currentPassword"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
           {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword.join(', ')}</p>}
        </div>
         <div>
          <label htmlFor="newPassword" aria-label="Yeni Şifre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Yeni Şifre <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="newPassword"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            maxLength={50}
            autoComplete="new-password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
           {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.join(', ')}</p>}
        </div>
         <div>
          <label htmlFor="confirmPassword" aria-label="Yeni Şifre Tekrar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Yeni Şifre Tekrar <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            maxLength={50}
            autoComplete="new-password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
           {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.join(', ')}</p>}
        </div>
        <div>
          <button
            type="submit"
            disabled={isPending || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isPending ? 'Güncelleniyor...' : 'Şifreyi Değiştir'}
          </button>
        </div>
      </form>
    </div>
  );
}