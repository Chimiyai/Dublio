'use client';

import { useState, useTransition, FormEvent } from 'react';

interface FormErrors {
  newEmail?: string[];
  general?: string;
}

export default function UpdateEmailForm() {
  const [newEmail, setNewEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    // Frontend Doğrulaması (Basit e-posta formatı)
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      setErrors({ newEmail: ['Lütfen geçerli bir e-posta adresi girin.'] });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/profile/email/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newEmail }),
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
                serverErrors.general = 'E-posta güncelleme talebi sırasında bilinmeyen bir hata oluştu.';
           }
           setErrors(serverErrors);
          return;
        }

        // Başarılı talep sonrası
        setSuccessMessage(data.message || `Doğrulama linki ${newEmail} adresine gönderildi.`);
        setNewEmail(''); // Input'u temizle

         // Başarı mesajını birkaç saniye sonra temizle
        setTimeout(() => setSuccessMessage(null), 6000); // Biraz daha uzun kalsın


      } catch (err) {
        console.error('E-posta güncelleme talep formu gönderim hatası:', err);
        setErrors({ general: 'Talep gönderilirken bir ağ hatası oluştu.' });
      }
    });
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">E-posta Adresini Güncelle</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Yeni e-posta adresinizi girin. Adresinize bir doğrulama bağlantısı göndereceğiz.
        Mevcut e-posta adresinize erişiminizi kaybetmeyin, değişiklik tamamlanana kadar gerekli olabilir.
      </p>
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
          <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Yeni E-posta Adresi <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="newEmail"
            id="newEmail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="ornek@eposta.com"
            autoComplete="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
           {errors.newEmail && <p className="mt-1 text-xs text-red-600">{errors.newEmail.join(', ')}</p>}
        </div>
        <div>
          <button
            type="submit"
            disabled={isPending || !newEmail}
            className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          >
            {isPending ? 'Gönderiliyor...' : 'Doğrulama E-postası Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
}