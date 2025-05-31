// src/components/admin/AddArtistForm.tsx
'use client';

import { useState, useTransition, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AddArtistFormData {
  firstName: string;
  lastName: string;
}

interface ApiErrorResponse {
  message: string;
  errors?: { [key: string]: string[] };
}

export default function AddArtistForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string[], lastName?: string[], general?: string }>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("İsim ve soyisim alanları zorunludur.");
      setErrors(prev => ({
        ...prev,
        firstName: !firstName.trim() ? ["İsim zorunludur."] : undefined,
        lastName: !lastName.trim() ? ["Soyisim zorunludur."] : undefined,
      }));
      return;
    }

    const loadingToastId = toast.loading('Sanatçı oluşturuluyor...');
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/sanatcilar', { // POST isteği
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
        });

        const data: any | ApiErrorResponse = await response.json(); // Tip any veya daha spesifik olabilir
        toast.dismiss(loadingToastId);

        if (!response.ok) {
          if (data.errors) {
            setErrors(data.errors);
            const firstErrorField = Object.keys(data.errors)[0] as keyof typeof errors;
            if (firstErrorField && data.errors[firstErrorField]?.[0]) {
              toast.error(data.errors[firstErrorField][0]);
            } else {
              toast.error(data.message || 'Bir hata oluştu.');
            }
          } else {
            toast.error(data.message || 'Bir hata oluştu.');
            setErrors({ general: data.message || 'Bir hata oluştu.' });
          }
          return;
        }
        
        // data.id veya data.slug (API'nizin ne döndürdüğüne bağlı)
        // Varsayalım ki API yeni sanatçının ID'sini veya slug'ını dönüyor
        // ve EditArtistForm /admin/sanatcilar/duzenle/[artistId_veya_slug] yolunu kullanıyor
        const artistIdentifier = data.slug || data.id; // API'nizin döndüğü değere göre

        if (!artistIdentifier) {
            toast.error("Sanatçı oluşturuldu ancak yönlendirme için ID/Slug alınamadı.");
            router.push('/admin/sanatcilar'); // Listeye yönlendir
            return;
        }

        toast.success(`Sanatçı "${data.firstName} ${data.lastName}" başarıyla oluşturuldu. Şimdi detayları düzenleyebilirsiniz.`);
        router.push(`/admin/sanatcilar/duzenle/${artistIdentifier}`); // Düzenleme sayfasına yönlendir

      } catch (err: any) {
        toast.dismiss(loadingToastId);
        toast.error(err.message || 'Bir ağ hatası oluştu.');
        setErrors({ general: 'Bir ağ hatası oluştu.' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          İsim <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="firstName"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.join(', ')}</p>}
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Soyisim <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="lastName"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.join(', ')}</p>}
      </div>
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isPending ? 'Oluşturuluyor...' : 'Sanatçı Oluştur ve Devam Et'}
        </button>
      </div>
    </form>
  );
}