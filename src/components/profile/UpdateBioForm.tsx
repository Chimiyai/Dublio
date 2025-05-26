// src/components/profile/UpdateBioForm.tsx
'use client';

import { useState, useTransition, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast'; // toast importunu ekleyelim

interface UpdateBioFormProps {
  currentBio: string | null; // <<< DEĞİŞİKLİK: Artık null kabul ediyor
}

interface FormErrors {
  bio?: string[];
  general?: string;
}

export default function UpdateBioForm({ currentBio }: UpdateBioFormProps) {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  // currentBio null ise state'i boş string ile başlat
  const [bio, setBio] = useState(currentBio ?? ''); // <<< DEĞİŞİKLİK: Null ise boş string
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);
    const loadingToastId = toast.loading('Biyografi güncelleniyor...');

    // Biyografi değişmediyse bir şey yapma (null kontrolü eklendi)
    if (bio.trim() === (currentBio ?? '').trim()) {
      toast.dismiss(loadingToastId);
      toast.error('Yeni biyografi mevcut olanla aynı veya boş bırakılamaz (eğer daha önce boşsa).', { id: 'bio-no-change' });
      // setErrors({ general: 'Yeni biyografi mevcut olanla aynı.' });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/profile/update-details', { // API endpoint'ini kontrol et
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bio: bio.trim() }), // Sadece bio gönder
        });

        const data = await response.json();

        if (!response.ok) {
          const serverErrors: FormErrors = {};
           if (data.errors && typeof data.errors === 'object') { // data.errors'ın obje olduğundan emin ol
             for (const key in data.errors) {
                 if (Object.prototype.hasOwnProperty.call(data.errors, key)) {
                     // serverErrors[key as keyof FormErrors] = data.errors[key];
                     if (key === 'bio') serverErrors.bio = data.errors[key];
                 }
             }
           }
           if(data.message && !Object.keys(serverErrors).length) {
               serverErrors.general = data.message;
           } else if (!Object.keys(serverErrors).length) {
                serverErrors.general = 'Biyografi güncellenirken bilinmeyen bir hata oluştu.';
           }
           setErrors(serverErrors);
           toast.error(serverErrors.general || (serverErrors.bio && serverErrors.bio[0]) || "Güncelleme başarısız.", { id: loadingToastId });
          return;
        }

        toast.success(data.message || 'Biyografi başarıyla güncellendi!', { id: loadingToastId });
        
        // Session güncelleme (opsiyonel, eğer bio session'da tutuluyorsa)
        if (session?.user) {
            await updateSession({ 
                ...session,
                user: { 
                    ...session.user, 
                    bio: data.user?.bio // API'den güncellenmiş kullanıcı verisi geliyorsa
                } 
            });
        }
        
        router.refresh();
        // Başarı mesajını birkaç saniye sonra temizle (toast zaten kendi kendine kapanır)
        // setTimeout(() => setSuccessMessage(null), 4000);

      } catch (err) {
        console.error('Biyografi güncelleme formu gönderim hatası:', err);
        setErrors({ general: 'Güncelleme sırasında bir ağ hatası oluştu.' });
        toast.error('Bir ağ hatası oluştu.', { id: loadingToastId });
      }
      // startTransition bittiğinde isPending otomatik false olur.
    });
  };

  return (
    // JSX'inizde başlık "Kullanıcı Adını Güncelle" yerine "Biyografini Güncelle" olmalı
    <div className="pt-6"> {/* mt-8 ve border-t ana formda var, burada sadece pt-6 */}
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Biyografini Düzenle</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* successMessage ve errors.general gösterimleri toast ile yapıldığı için kaldırılabilir */}
        {/* Veya toast'a ek olarak burada da tutulabilir */}
        <div>
          <label htmlFor="bio-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Biyografi
          </label>
          <textarea
            name="bio"
            id="bio-input" // id'yi benzersiz yapalım
            rows={4}
            value={bio} // State'ten gelen değeri kullan
            onChange={(e) => setBio(e.target.value)}
            maxLength={500} // Şemanızdaki max(5000)'e göre ayarlayın
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
            placeholder="Kendinden bahset..."
          />
           {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio.join(', ')}</p>}
        </div>
        <div>
          <button
            type="submit"
            disabled={isPending || bio.trim() === (currentBio ?? '').trim()} // Değişiklik yoksa veya işlem varsa butonu disable et
            className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
          >
            {isPending ? 'Kaydediliyor...' : 'Biyografiyi Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}