'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, FormEvent } from 'react';

interface FormErrors {
  firstName?: string[];
  lastName?: string[];
  bio?: string[];
  imageUrl?: string[];
  general?: string;
}

export default function AddArtistForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState(''); // name yerine firstName
  const [lastName, setLastName] = useState('');   // Yeni: lastName
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

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
    
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/sanatcilar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName, // Güncellendi
            lastName,  // Eklendi
            bio,
            imageUrl: imageUrl.trim() === '' ? undefined : imageUrl,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.errors) {
            setErrors(data.errors);
          } else {
            setErrors({ general: data.message || 'Sanatçı eklenirken bir hata oluştu.' });
          }
          return;
        }

        alert(`'${data.firstName} ${data.lastName}' adlı sanatçı başarıyla eklendi.`); // İsim ve soyismi birleştir
        router.push('/admin/sanatcilar');
        router.refresh();
      } catch (err) {
        console.error('Sanatçı ekleme formu gönderim hatası:', err);
        setErrors({ general: 'Bir ağ hatası oluştu veya sunucudan geçersiz yanıt alındı.' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* İsim ve soyisim için grid */}
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
          placeholder="https://example.com/image.jpg"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
        {errors.imageUrl && <p className="mt-2 text-sm text-red-600">{errors.imageUrl.join(', ')}</p>}
      </div>

      {errors.general && <p className="mt-2 text-sm text-red-600">{errors.general}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isPending ? 'Ekleniyor...' : 'Sanatçıyı Ekle'}
        </button>
      </div>
    </form>
  );
}