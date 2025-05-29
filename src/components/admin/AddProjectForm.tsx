// src/components/admin/AddProjectForm.tsx
'use client';

import { useState, FormEvent, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Select from 'react-select'; // react-select importu
import { DubbingArtist, RoleInProject } from '@prisma/client'; // Tipleri import et
import ImageUploader from '@/components/admin/ImageUploader';

// Formdaki mevcut atamaların state tipi (EditProjectForm'dan alındı)
interface CurrentAssignment {
    artistId: number;
    role: RoleInProject;
    artistName?: string; // Sanatçı adını da tutalım, göstermek için
}

// Props tipi
interface AddProjectFormProps {
  allArtists: DubbingArtist[]; // <-- TÜM DubbingArtist ALANLARINI BEKLİYOR
  availableRoles: RoleInProject[];
}


export default function AddProjectForm({ allArtists, availableRoles }: AddProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'oyun' | 'anime'>('oyun');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImagePublicId, setCoverImagePublicId] = useState<string | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [releaseDate, setReleaseDate] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Sanatçı atama için state'ler (EditProjectForm'dan alındı)
  const [currentAssignments, setCurrentAssignments] = useState<CurrentAssignment[]>([]);
  const [selectedArtistToAdd, setSelectedArtistToAdd] = useState<{ value: number; label: string } | null>(null);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<RoleInProject | ''>('');


  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any>({}); // Zod'dan gelen hatalar için
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generateSlug = (text: string) => { /* ... (aynı) ... */ 
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(generateSlug(newTitle));
  };

  // Sanatçı atama fonksiyonları (EditProjectForm'dan alındı ve uyarlandı)
  const addAssignment = () => {
    if (!selectedArtistToAdd || !selectedRoleToAdd) {
      setFormErrors((prev: any) => ({ ...prev, assignments: ["Lütfen bir sanatçı ve rol seçin."] }));
      return;
    }
    const exists = currentAssignments.some(
      a => a.artistId === selectedArtistToAdd.value && a.role === selectedRoleToAdd
    );
    if (exists) {
      setFormErrors((prev: any) => ({ ...prev, assignments: ["Bu sanatçı bu rolle zaten atanmış."] }));
      return;
    }
    setCurrentAssignments(prev => [
      ...prev,
      {
        artistId: selectedArtistToAdd.value,
        role: selectedRoleToAdd,
        artistName: selectedArtistToAdd.label
      }
    ]);
    setFormErrors((prev: any) => ({ ...prev, assignments: undefined }));
    setSelectedArtistToAdd(null);
    setSelectedRoleToAdd('');
  };

  const removeAssignment = (artistId: number, role: RoleInProject) => {
    setCurrentAssignments(prev =>
      prev.filter(a => !(a.artistId === artistId && a.role === role))
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFormErrors({});

    // Temel zorunlu alan kontrolü (API zaten Zod ile yapacak)
    if (!title || !slug || !type || !releaseDate) {
      setError('Başlık, slug, tür ve yayın tarihi alanları zorunludur.');
      return;
    }
    // ... (releaseDateObj kontrolü aynı)
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
        const assignmentsForApi = currentAssignments.map(({ artistId, role }) => ({ artistId, role }));

        const response = await fetch('/api/admin/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug,
            type,
            description: description || null,
            coverImage: coverImage,
            coverImagePublicId: coverImagePublicId,
            releaseDate: releaseDateObj.toISOString(),
            isPublished,
            assignments: assignmentsForApi, // Atamaları API'ye gönder
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.errors) { // Zod'dan gelen hatalar
            setFormErrors(data.errors);
            setError("Lütfen formdaki hataları düzeltin.");
          } else {
            setError(data.message || 'Proje oluşturulamadı.');
          }
          return; // Hata varsa burada dur
        }

        setSuccess('Proje başarıyla oluşturuldu! Proje listesine yönlendiriliyorsunuz...');
        setTimeout(() => {
          router.push('/admin/projeler');
          router.refresh();
        }, 2000);

      } catch (err: any) {
        setError(err.message);
      }
    });
  };
  
  const artistOptions = allArtists.map(artist => ({
    value: artist.id,
    label: `${artist.firstName} ${artist.lastName}`
  }));

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 space-y-6">
        {error && <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">{error}</div>}
        {success && <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded">{success}</div>}

        {/* Temel Proje Bilgileri */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlık <span className="text-red-500">*</span></label>
          <input type="text" name="title" id="title" value={title} onChange={handleTitleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200" />
          {formErrors.title && <p className="mt-1 text-xs text-red-600">{Array.isArray(formErrors.title) ? formErrors.title.join(', ') : formErrors.title}</p>}
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL Metni (Slug) <span className="text-red-500">*</span></label>
          <input type="text" name="slug" id="slug" value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} placeholder="baslik-buraya-kucuk-harf-tireli" required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200" />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL'de görünecek kısım. Sadece küçük harf, rakam ve tire (-).</p>
          {formErrors.slug && <p className="mt-1 text-xs text-red-600">{Array.isArray(formErrors.slug) ? formErrors.slug.join(', ') : formErrors.slug}</p>}
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tür <span className="text-red-500">*</span></label>
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as 'oyun' | 'anime')} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-200">
            <option value="oyun">Oyun</option>
            <option value="anime">Anime</option>
          </select>
          {formErrors.type && <p className="mt-1 text-xs text-red-600">{Array.isArray(formErrors.type) ? formErrors.type.join(', ') : formErrors.type}</p>}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
          <textarea id="description" name="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200" />
          {formErrors.description && <p className="mt-1 text-xs text-red-600">{Array.isArray(formErrors.description) ? formErrors.description.join(', ') : formErrors.description}</p>}
        </div>
        
        <ImageUploader
  currentImagePublicId={coverImagePublicId} // Mevcut resmi göster (yeni projede null olacak)
  onFileSelect={(file) => {                 // Sadece dosyayı seç
      setSelectedCoverFile(file);
      if (file) setCoverImagePublicId(URL.createObjectURL(file)); // Önizleme
      else setCoverImagePublicId(null);
  }}
  aspectRatio="aspect-[16/9]"
  label="Kapak Resmi Yükle"
  // onUploadComplete prop'u kaldırıldı, yükleme handleSubmit'te
/>
        {formErrors.coverImage && <p className="mt-1 text-xs text-red-600">{Array.isArray(formErrors.coverImage) ? formErrors.coverImage.join(', ') : formErrors.coverImage}</p>}
        
        <div>
          <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yayın Tarihi <span className="text-red-500">*</span></label>
          <input type="date" name="releaseDate" id="releaseDate" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-200" />
          {formErrors.releaseDate && <p className="mt-1 text-xs text-red-600">{Array.isArray(formErrors.releaseDate) ? formErrors.releaseDate.join(', ') : formErrors.releaseDate}</p>}
        </div>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input id="isPublished" name="isPublished" type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:checked:bg-indigo-500" />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="isPublished" className="font-medium text-gray-700 dark:text-gray-300">Yayında</label>
            <p className="text-gray-500 dark:text-gray-400">İşaretlenirse proje sitede görünür olur.</p>
          </div>
          {formErrors.isPublished && <p className="mt-1 text-xs text-red-600">{Array.isArray(formErrors.isPublished) ? formErrors.isPublished.join(', ') : formErrors.isPublished}</p>}
        </div>

        {/* Sanatçı Atama Bölümü (EditProjectForm'dan alındı ve uyarlandı) */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">Proje Katılımcıları ve Rolleri</h3>
            {formErrors.assignments && <p className="mt-2 text-sm text-red-600">{Array.isArray(formErrors.assignments) ? formErrors.assignments.join(', ') : formErrors.assignments}</p>}

            <div className="mt-4 mb-6 space-y-2">
                {currentAssignments.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Henüz bu projeye atanmış kimse yok.</p>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 border rounded-md dark:border-gray-600">
                        {currentAssignments.map((assignment) => (
                            <li key={`${assignment.artistId}-${assignment.role}`} className="px-4 py-3 flex items-center justify-between text-sm">
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{assignment.artistName}</span>
                                    <span className="ml-2 px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                        {assignment.role.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <button type="button" onClick={() => removeAssignment(assignment.artistId, assignment.role)} className="font-medium text-red-600 hover:text-red-500" disabled={isPending}>
                                    Kaldır
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-4 pt-4 border-t dark:border-gray-600">
                <div className='flex-grow'>
                    <label htmlFor='select-artist-to-add-new' className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sanatçı Seç</label>
                    <Select
                        instanceId="select-artist-to-add-new"
                        inputId='select-artist-to-add-new'
                        options={artistOptions}
                        value={selectedArtistToAdd}
                        onChange={(option) => setSelectedArtistToAdd(option)}
                        placeholder="Sanatçı ara veya seç..."
                        isClearable
                        isDisabled={isPending}
                        className="text-sm react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                <div className='w-full sm:w-auto'>
                    <label htmlFor="select-role-to-add-new" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol Seç</label>
                    <select id="select-role-to-add-new" value={selectedRoleToAdd} onChange={(e) => setSelectedRoleToAdd(e.target.value as RoleInProject)} disabled={isPending} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white h-[38px]">
                        <option value="" disabled>Rol seçin...</option>
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
                <button type="button" onClick={addAssignment} disabled={!selectedArtistToAdd || !selectedRoleToAdd || isPending} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 h-[38px] whitespace-nowrap">
                    Ata
                </button>
            </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <Link href="/admin/projeler" className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm transition duration-150 ease-in-out">
              İptal
            </Link>
            <button type="submit" disabled={isPending || !!success} className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out ${isPending || !!success ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isPending ? 'Kaydediliyor...' : 'Projeyi Kaydet'}
            </button>
          </div>
        </div>
      </form>
  );
}