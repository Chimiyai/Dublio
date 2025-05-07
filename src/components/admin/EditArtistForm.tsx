'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, FormEvent, useEffect } from 'react';
import { DubbingArtist } from '@prisma/client'; // Prisma model tipini import et

interface EditArtistFormProps {
  artist: DubbingArtist; // Düzenlenecek sanatçının mevcut verileri
}

interface FormErrors {
  firstName?: string[];
  lastName?: string[];
  bio?: string[];
  imageUrl?: string[];
  general?: string;
}

export default function EditArtistForm({ artist }: EditArtistFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(artist.firstName);
  const [lastName, setLastName] = useState(artist.lastName);
  const [bio, setBio] = useState(artist.bio || '');
  const [imageUrl, setImageUrl] = useState(artist.imageUrl || '');
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Eğer prop'tan gelen artist verisi değişirse (pek olası değil ama) state'leri güncelle
  useEffect(() => {
    setFirstName(artist.firstName);
    setLastName(artist.lastName);
    setBio(artist.bio || '');
    setImageUrl(artist.imageUrl || '');
  }, [artist]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    let formValid = true;
    if (!firstName.trim()) {
      setErrors(prev => ({ ...prev, firstName: ["Sanatçı adı boş bırakılamaz."] }));
      formValid = false;
    }
    if (!lastName.trim()) {
      setErrors(prev => ({ ...prev, lastName: ["Sanatçı soyadı boş bırakılamaz."] }));
      formValid = false;
    }
    if (!formValid) return;

    // Sadece değişen verileri gönder
    const dataToUpdate: Partial<DubbingArtist> = {};
    if (firstName !== artist.firstName) dataToUpdate.firstName = firstName;
    if (lastName !== artist.lastName) dataToUpdate.lastName = lastName;
    if (bio !== (artist.bio || '')) dataToUpdate.bio = bio;
    // imageUrl için: eğer boş string ise null, değilse ve değişmişse değeri gönder
    const finalImageUrl = imageUrl.trim() === '' ? null : imageUrl;
    if (finalImageUrl !== (artist.imageUrl || null) ) {
        dataToUpdate.imageUrl = finalImageUrl;
    }


    if (Object.keys(dataToUpdate).length === 0) {
        setSuccessMessage("Değişiklik yapılmadı.");
        return;
    }
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/sanatcilar/${artist.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToUpdate),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.errors) {
            setErrors(data.errors);
          } else {
            setErrors({ general: data.message || 'Sanatçı güncellenirken bir hata oluştu.' });
          }
          return;
        }

        setSuccessMessage(`'${data.firstName} ${data.lastName}' adlı sanatçı başarıyla güncellendi.`);
        // Formu güncellenmiş verilerle yenile (opsiyonel, sayfa yenileme de yapılabilir)
        // setFirstName(data.firstName);
        // setLastName(data.lastName);
        // setBio(data.bio || '');
        // setImageUrl(data.imageUrl || '');
        // artist prop'unu güncellemek için router.refresh daha iyi olabilir.
        router.refresh(); // Sayfayı yenileyerek güncel veriyi (ve formu) tekrar yükle
      } catch (err) {
        console.error('Sanatçı güncelleme formu gönderim hatası:', err);
        setErrors({ general: 'Bir ağ hatası oluştu veya sunucudan geçersiz yanıt alındı.' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
      {successMessage && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800" role="alert">
          {successMessage}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Adı <span className="text-red-500">*</span>
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
          {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName.join(', ')}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Soyadı <span className="text-red-500">*</span>
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
          {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName.join(', ')}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Biyografi
        </label>
        <textarea
          name="bio"
          id="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
        {errors.bio && <p className="mt-2 text-sm text-red-600">{errors.bio.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Resim URL'si
        </label>
        <input
          type="url"
          name="imageUrl"
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg veya boş bırakın"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
        {errors.imageUrl && <p className="mt-2 text-sm text-red-600">{errors.imageUrl.join(', ')}</p>}
      </div>

      {errors.general && (
         <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
            {errors.general}
         </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isPending ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </form>
  );
}