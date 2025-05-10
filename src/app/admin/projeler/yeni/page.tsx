// src/app/admin/projeler/yeni/page.tsx
'use client';

import { useState, FormEvent, useTransition } from 'react'; // useTransition eklendi
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CoverImageUploader from '@/components/admin/CoverImageUploader'; // CoverImageUploader import edildi

export default function YeniProjePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'game' | 'anime'>('game');
  const [description, setDescription] = useState('');
  
  // Kapak resmi için yeni state'ler
  const [coverImage, setCoverImage] = useState<string | null>(null); // Tam URL'i tutacak
  const [coverImagePublicId, setCoverImagePublicId] = useState<string | null>(null); // Public ID'yi tutacak
  
  const [releaseDate, setReleaseDate] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // isLoading yerine useTransition kullanalım, daha iyi bir UX için
  const [isPending, startTransition] = useTransition();

  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Slug'ı otomatik olarak başlığa göre doldur, kullanıcı sonra değiştirebilir
    setSlug(generateSlug(newTitle));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title || !slug || !type || !releaseDate) {
        setError('Başlık, slug, tür ve yayın tarihi alanları zorunludur.');
        return;
    }

    let releaseDateObj;
    try {
        releaseDateObj = new Date(releaseDate);
        if (isNaN(releaseDateObj.getTime())) {
            throw new Error('Geçersiz yayın tarihi formatı.');
        }
    } catch (parseError) {
        setError('Geçersiz yayın tarihi formatı. Lütfen YYYY-MM-DD gibi bir format kullanın.');
        return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug,
            type,
            description: description || null,
            coverImage: coverImage, // Yeni state'ten gelen tam URL
            coverImagePublicId: coverImagePublicId, // Yeni state'ten gelen Public ID
            releaseDate: releaseDateObj.toISOString(),
            isPublished,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Hata mesajlarını daha iyi yönetmek için Zod ile API'de validasyon yapıp
          // data.errors objesini burada işleyebiliriz (EditProjectForm'daki gibi)
          throw new Error(data.message || 'Proje oluşturulamadı.');
        }

        setSuccess('Proje başarıyla oluşturuldu! Proje listesine yönlendiriliyorsunuz...');
        setTimeout(() => {
          router.push('/admin/projeler');
          router.refresh(); // Liste sayfasının yenilenmesini sağlar
        }, 2000);

      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Yeni Proje Ekle</h1>
        <Link href="/admin/projeler" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          ← Proje Listesine Geri Dön
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 space-y-6">
        {error && <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">{error}</div>}
        {success && <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded">{success}</div>}

        {/* ... (title, slug, type, description inputları aynı kalacak) ... */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlık <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="title"
            id="title"
            value={title}
            onChange={handleTitleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL Metni (Slug) <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="slug"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(generateSlug(e.target.value))}
            placeholder="baslik-buraya-kucuk-harf-tireli"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
           <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL'de görünecek kısım. Sadece küçük harf, rakam ve tire (-).</p>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tür <span className="text-red-500">*</span></label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'game' | 'anime')}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="game">Oyun</option>
            <option value="anime">Anime</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
        
        {/* --- COVER IMAGE UPLOADER ENTEGRASYONU --- */}
        <CoverImageUploader
          currentCoverImageUrl={null} // Yeni proje için başlangıçta resim yok
          currentCoverImagePublicId={null} // Yeni proje için başlangıçta public ID yok
          onUploadComplete={({ imageUrl, publicId }) => {
            setCoverImage(imageUrl);
            setCoverImagePublicId(publicId);
          }}
          // Yeni proje için projectIdOrSlug'a geçici bir değer veya slug'ı verebiliriz.
          // Slug henüz tam oluşmamış olabilir, bu yüzden belki proje başlığını kullanabiliriz
          // veya yükleme API'si slug olmadan da çalışacak şekilde ayarlanabilir.
          // Şimdilik slug'ı kullanmayı deneyelim, boşsa API tarafında handle edilebilir.
          projectIdOrSlug={slug || title || 'yeni-proje'} 
        />
        {/* Eski URL input'unu kaldırıyoruz, çünkü artık uploader var */}
        {/*
        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kapak Resmi URL</label>
          <input
            type="url"
            name="coverImage"
            id="coverImage"
            value={coverImage || ''} // state artık string | null
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://example.com/resim.jpg"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
        </div>
        */}
        {/* --------------------------------------- */}

        {/* ... (releaseDate ve isPublished inputları aynı kalacak) ... */}
        <div>
          <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yayın Tarihi <span className="text-red-500">*</span></label>
          <input
            type="date"
            name="releaseDate"
            id="releaseDate"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
          />
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="isPublished"
              name="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-indigo-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="isPublished" className="font-medium text-gray-700 dark:text-gray-300">Yayında</label>
            <p className="text-gray-500 dark:text-gray-400">İşaretlenirse proje sitede görünür olur.</p>
          </div>
        </div>


        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <Link href="/admin/projeler" className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm transition duration-150 ease-in-out">
              İptal
            </Link>
            <button
              type="submit"
              disabled={isPending || !!success}
              className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out ${isPending || !!success ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPending ? 'Kaydediliyor...' : 'Projeyi Kaydet'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}