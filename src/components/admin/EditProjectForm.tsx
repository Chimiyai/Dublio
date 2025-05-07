'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Project } from '@prisma/client';

interface EditProjectFormProps {
  project: Project;
}

export default function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [type, setType] = useState<'game' | 'anime'>(project.type as 'game' | 'anime');
  const [description, setDescription] = useState(project.description || '');
  const [coverImage, setCoverImage] = useState(project.coverImage || '');
  const [releaseDate, setReleaseDate] = useState(
    project.releaseDate ? new Date(project.releaseDate).toISOString().split('T')[0] : ''
  );
  const [isPublished, setIsPublished] = useState(project.isPublished);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!title || !type || !releaseDate) {
        setError('Başlık, tür ve yayın tarihi alanları zorunludur.');
        setIsLoading(false);
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
        setIsLoading(false);
        return;
    }

    try {
      // API YOLUNU GÜNCELLEDİK: "projeler" olarak
      const response = await fetch(`/api/admin/projeler/${project.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          description: description || null,
          coverImage: coverImage || null,
          releaseDate: releaseDateObj.toISOString(),
          isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Proje güncellenemedi.');
      }

      setSuccess('Proje başarıyla güncellendi! Proje listesine yönlendiriliyorsunuz...');
      setTimeout(() => {
        router.push('/admin/projeler');
        router.refresh();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... (Formun geri kalan JSX kısmı aynı kalacak, bir önceki mesajdaki gibi) ...
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 space-y-6">
      {error && <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">{error}</div>}
      {success && <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded">{success}</div>}

      {/* Başlık */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlık <span className="text-red-500">*</span></label>
        <input
          type="text" name="title" id="title" value={title}
          onChange={(e) => setTitle(e.target.value)} required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
      </div>

      {/* URL Metni (Slug) */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">URL Metni (Slug):</p>
        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{project.slug}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Slug genellikle değiştirilmez. Değiştirmek için projeyi silip yeniden oluşturun.</p>
      </div>


      {/* Tür */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tür <span className="text-red-500">*</span></label>
        <select id="type" name="type" value={type}
          onChange={(e) => setType(e.target.value as 'game' | 'anime')} required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="game">Oyun</option>
          <option value="anime">Anime</option>
        </select>
      </div>

      {/* Açıklama */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
        <textarea id="description" name="description" rows={4} value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
      </div>

      {/* Kapak Resmi URL */}
      <div>
        <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kapak Resmi URL</label>
        <input type="url" name="coverImage" id="coverImage" value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://example.com/resim.jpg"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
      </div>

      {/* Yayın Tarihi */}
      <div>
        <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yayın Tarihi <span className="text-red-500">*</span></label>
        <input type="date" name="releaseDate" id="releaseDate" value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)} required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200"
        />
      </div>

      {/* Yayında mı? */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input id="isPublished" name="isPublished" type="checkbox" checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-indigo-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isPublished" className="font-medium text-gray-700 dark:text-gray-300">Yayında</label>
        </div>
      </div>

      {/* Butonlar */}
      <div className="pt-5">
        <div className="flex justify-end space-x-3">
          <Link href="/admin/projeler" className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm transition duration-150 ease-in-out">
            İptal
          </Link>
          <button type="submit" disabled={isLoading || !!success}
            className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out ${isLoading || !!success ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Güncelleniyor...' : 'Projeyi Güncelle'}
          </button>
        </div>
      </div>
    </form>
  );
}