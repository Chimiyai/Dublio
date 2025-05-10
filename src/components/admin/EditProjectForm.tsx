// src/components/admin/EditProjectForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, FormEvent, useEffect } from 'react';
import { Project, DubbingArtist, RoleInProject } from '@prisma/client';
import Select from 'react-select';
import ImageUploader from '@/components/admin/ImageUploader';

// API'den gelen proje tipi (assignments dahil)
interface ProjectWithPrismaAssignments extends Project {
    assignments: { artistId: number; role: RoleInProject }[];
}

// Bileşen Props Tipi
interface EditProjectFormProps {
  project: ProjectWithPrismaAssignments;
  allArtists: DubbingArtist[];
  availableRoles: RoleInProject[];
}

// Formdaki mevcut atamaların state tipi
interface CurrentAssignment {
    artistId: number;
    role: RoleInProject;
    artistName?: string;
}

// Form Hataları Tipi
interface FormErrors {
  title?: string[];
  slug?: string[];
  type?: string[];
  description?: string[];
  coverImage?: string[];
  releaseDate?: string[];
  isPublished?: string[];
  assignments?: string[]; // Genel atama hatası için
  general?: string;
}

export default function EditProjectForm({ project, allArtists, availableRoles }: EditProjectFormProps) {
  const router = useRouter();

  // --- State Tanımlamaları ---
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [type, setType] = useState(project.type);
  const [description, setDescription] = useState(project.description || '');
  const [coverImage, setCoverImage] = useState(project.coverImage || '');
  const [coverImagePublicId, setCoverImagePublicId] = useState(project.coverImagePublicId || null);
  const [releaseDate, setReleaseDate] = useState(
    project.releaseDate ? new Date(project.releaseDate).toISOString().split('T')[0] : ''
  );
  const [isPublished, setIsPublished] = useState(project.isPublished);

  const [currentAssignments, setCurrentAssignments] = useState<CurrentAssignment[]>(() => { // Fonksiyonel başlangıç değeri
    // --- GÜVENLİK KONTROLÜ EKLE ---
    const initialAssignments = project.assignments || []; // Eğer undefined ise boş dizi kullan
    // -----------------------------
    return initialAssignments.map(a => {
        const artist = allArtists.find(art => art.id === a.artistId);
        return {
            artistId: a.artistId,
            role: a.role,
            artistName: artist ? `${artist.firstName} ${artist.lastName}` : 'Bilinmeyen Sanatçı'
        };
    });
});

  const [selectedArtistToAdd, setSelectedArtistToAdd] = useState<{ value: number; label: string } | null>(null);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<RoleInProject | ''>('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // -------------------------

  // --- Yardımcı Fonksiyonlar ---
  const addAssignment = () => {
    if (!selectedArtistToAdd || !selectedRoleToAdd) {
        setErrors(prev => ({...prev, assignments: ["Lütfen bir sanatçı ve rol seçin."]}));
        return;
    }
    const exists = currentAssignments.some(
        a => a.artistId === selectedArtistToAdd.value && a.role === selectedRoleToAdd
    );
    if (exists) {
        setErrors(prev => ({...prev, assignments: ["Bu sanatçı bu rolle zaten atanmış."]}));
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
    setErrors(prev => ({...prev, assignments: undefined })); // Hata mesajını temizle
    setSelectedArtistToAdd(null);
    setSelectedRoleToAdd('');
  };

  const removeAssignment = (artistId: number, role: RoleInProject) => {
    setCurrentAssignments(prev =>
        prev.filter(a => !(a.artistId === artistId && a.role === role))
    );
  };
  // -------------------------

  // --- Form Gönderme Fonksiyonu ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    // Temel alan kontrolleri (isteğe bağlı, Zod backend'de yapıyor)
    let formValid = true;
    if (!title.trim()) {
      setErrors(prev => ({ ...prev, title: ["Başlık boş bırakılamaz."] }));
      formValid = false;
    }
     if (!slug.trim()) {
      setErrors(prev => ({ ...prev, slug: ["Slug boş bırakılamaz."] }));
      formValid = false;
    }
    // ... diğer zorunlu alan kontrolleri ...
    if (!formValid) return;


    // Sadece değişen verileri gönder
    const dataToUpdate: { [key: string]: any } = {};

    if (title !== project.title) dataToUpdate.title = title;
    if (slug !== project.slug) dataToUpdate.slug = slug;
    if (type !== project.type) dataToUpdate.type = type;
    if (description !== (project.description || '')) dataToUpdate.description = description.trim() === '' ? null : description;
    const finalCoverImage = coverImage.trim() === '' ? null : coverImage;
if (finalCoverImage !== (project.coverImage || null)) {
    dataToUpdate.coverImage = finalCoverImage;
}
if (coverImagePublicId !== (project.coverImagePublicId || null)) {
    dataToUpdate.coverImagePublicId = coverImagePublicId;
}
    const initialDate = project.releaseDate ? new Date(project.releaseDate).toISOString().split('T')[0] : '';
    if (releaseDate !== initialDate) dataToUpdate.releaseDate = releaseDate ? new Date(releaseDate) : null;
    if (isPublished !== project.isPublished) dataToUpdate.isPublished = isPublished;

    // Atamaların değişip değişmediğini kontrol et
    const initialAssignments = project.assignments || [];
    const currentAssignmentsForApi = currentAssignments.map(({ artistId, role }) => ({ artistId, role }));

    const assignmentsChanged =
        initialAssignments.length !== currentAssignmentsForApi.length ||
        !initialAssignments.every(initial =>
            currentAssignmentsForApi.some(current =>
                current.artistId === initial.artistId && current.role === initial.role
            )
        ) ||
        !currentAssignmentsForApi.every(current =>
            initialAssignments.some(initial =>
                initial.artistId === current.artistId && initial.role === current.role
            )
        );

    if (assignmentsChanged) {
        dataToUpdate.assignments = currentAssignmentsForApi;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      setSuccessMessage("Değişiklik yapılmadı.");
      // Belki 3 saniye sonra mesajı temizle
      setTimeout(() => setSuccessMessage(null), 3000);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/projects/${project.slug}`, { // Orijinal slug ile istek atılır
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToUpdate),
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
                serverErrors.general = 'Proje güncellenirken bilinmeyen bir hata oluştu.';
           }
           setErrors(serverErrors);
          return;
        }

        setSuccessMessage(`'${data.title}' projesi başarıyla güncellendi.`);
        // Başarı mesajını bir süre sonra temizle
        setTimeout(() => setSuccessMessage(null), 3000);

        // Eğer slug değiştiyse, liste sayfasına yönlendir, değişmediyse sayfayı yenile
        // Yeni slug ile yönlendirme daha mantıklı olurdu ama şimdilik liste
        if(data.slug && data.slug !== project.slug) {
            router.push('/admin/projeler');
        } else {
            // Mevcut sayfada kalıp verinin yenilenmesini sağla
            router.refresh();
             // Başarılı güncelleme sonrası state'i sıfırlamaya gerek yok, refresh zaten yeni prop'ları getirecek
        }

      } catch (err) {
        console.error('Proje güncelleme formu gönderim hatası:', err);
        setErrors({ general: 'Bir ağ hatası oluştu veya sunucudan geçersiz yanıt alındı.' });
      }
    });
  };
  // -------------------------

  // --- react-select için seçenekler ---
  const artistOptions = allArtists.map(artist => ({
      value: artist.id,
      label: `${artist.firstName} ${artist.lastName}`
  }));
  // -------------------------

  // --- JSX ---
  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl">
      {successMessage && (
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300" role="alert">
          {successMessage}
        </div>
      )}
      {errors.general && (
         <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300" role="alert">
            {errors.general}
         </div>
      )}

      {/* Proje Detayları Form Alanları */}
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlık <span className="text-red-500">*</span></label>
          <input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
           {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.join(', ')}</p>}
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug <span className="text-red-500">*</span></label>
          <input type="text" name="slug" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.join(', ')}</p>}
        </div>
        <div className="sm:col-span-3">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tür <span className="text-red-500">*</span></label>
            <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="game">Oyun</option>
                <option value="anime">Anime</option>
            </select>
            {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.join(', ')}</p>}
        </div>
         <div className="sm:col-span-3">
            <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yayın Tarihi <span className="text-red-500">*</span></label>
            <input type="date" name="releaseDate" id="releaseDate" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
             {errors.releaseDate && <p className="mt-1 text-xs text-red-600">{errors.releaseDate.join(', ')}</p>}
        </div>
        <div className="sm:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
          <textarea id="description" name="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.join(', ')}</p>}
          </div>
{/* --- COVER IMAGE UPLOADER --- */}
<div className="sm:col-span-6">
<ImageUploader
  currentImageUrl={coverImage} // Mevcut URL state'i
  currentImagePublicId={coverImagePublicId} // Mevcut Public ID state'i
  onUploadComplete={({ imageUrl, publicId }) => {
    setCoverImage(imageUrl);
    setCoverImagePublicId(publicId);
  }}
  uploadApiEndpoint="/api/admin/projects/cover-image"
  folder="project_covers"
  identifier={project.slug} // Mevcut projenin slug'ı
  aspectRatio="aspect-[16/9]"
  label="Kapak Resmi"
/>
            {/* CoverImage input'unu (text olarak) kaldırabilir veya gizleyebiliriz artık */}
            {/* Veya Uploader'dan gelen URL'yi göstermek için bir readonly input */}
            {errors.coverImage && <p className="mt-1 text-xs text-red-600">{errors.coverImage.join(', ')}</p>}
        </div>
        {/* -------------------------- */}
         <div className="sm:col-span-6">
             <div className="flex items-center">
                <input id="isPublished" name="isPublished" type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"/>
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Yayında</label>
             </div>
             {errors.isPublished && <p className="mt-1 text-xs text-red-600">{errors.isPublished.join(', ')}</p>}
         </div>
      </div>

      {/* Sanatçı Atama Bölümü */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">Proje Katılımcıları ve Rolleri</h3>
          {errors.assignments && <p className="mt-2 text-sm text-red-600">{errors.assignments}</p>}

          {/* Mevcut Atamalar */}
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
                                      {assignment.role.replace('_', ' ')}
                                  </span>
                              </div>
                              <button
                                  type="button"
                                  onClick={() => removeAssignment(assignment.artistId, assignment.role)}
                                  className="font-medium text-red-600 hover:text-red-500"
                                  disabled={isPending}
                              >
                                  Kaldır
                              </button>
                          </li>
                      ))}
                  </ul>
              )}
          </div>

          {/* Yeni Atama Ekleme */}
          <div className="flex flex-col sm:flex-row items-end gap-4 pt-4 border-t dark:border-gray-600">
              <div className='flex-grow'>
                   <label htmlFor='select-artist-to-add' className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sanatçı Seç</label>
                   <Select
                       instanceId="select-artist-to-add" // Benzersiz ID önemli
                       inputId='select-artist-to-add' // Erişilebilirlik için
                       options={artistOptions}
                       value={selectedArtistToAdd}
                       onChange={(option) => setSelectedArtistToAdd(option)}
                       placeholder="Sanatçı ara veya seç..."
                       isClearable
                       isDisabled={isPending}
                        // react-select stillendirme (opsiyonel, tailwind ile daha zor)
                       styles={{ 
                           control: (base) => ({ ...base, backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)'}),
                           menu: (base) => ({ ...base, backgroundColor: 'var(--input-bg)'}),
                           option: (base, { isFocused, isSelected }) => ({
                             ...base,
                             backgroundColor: isSelected ? 'var(--indigo-600)' : isFocused ? 'var(--indigo-100)' : 'var(--input-bg)',
                             color: isSelected ? 'white' : 'var(--text-color)',
                             ':active': {
                               backgroundColor: isSelected ? 'var(--indigo-700)' : 'var(--indigo-200)',
                             },
                           }),
                            // Dark mode için CSS değişkenleri kullanmaya çalıştım, globals.css'te tanımlanmalı
                       }}
                        // Veya className ile Tailwind sınıfları
                       className="text-sm" 
                       classNamePrefix="react-select" // Özel CSS için prefix
                   />
              </div>
               <div className='w-full sm:w-auto'>
                   <label htmlFor="select-role-to-add" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol Seç</label>
                   <select
                      id="select-role-to-add"
                      value={selectedRoleToAdd}
                      onChange={(e) => setSelectedRoleToAdd(e.target.value as RoleInProject)}
                      disabled={isPending}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white h-[38px]" // react-select ile aynı yükseklik
                   >
                       <option value="" disabled>Rol seçin...</option>
                       {availableRoles.map(role => (
                           <option key={role} value={role}>{role.replace('_', ' ')}</option>
                       ))}
                   </select>
               </div>
              <button
                  type="button"
                  onClick={addAssignment}
                  disabled={!selectedArtistToAdd || !selectedRoleToAdd || isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 h-[38px] whitespace-nowrap"
              >
                  Ata
              </button>
          </div>
      </div>


      {/* Kaydet Butonu */}
      <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
          >
            {isPending ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>
    </form>
  );
}

// CSS Değişkenleri (globals.css'e eklenebilir)
/*
:root {
  --input-bg: white;
  --input-border: #d1d5db; // gray-300
  --text-color: #1f2937; // gray-800
  --indigo-100: #e0e7ff;
  --indigo-200: #c7d2fe;
  --indigo-600: #4f46e5;
  --indigo-700: #4338ca;
}

[data-theme='dark'] { // Veya dark class'ı body'de ise .dark
  --input-bg: #374151; // gray-700
  --input-border: #4b5563; // gray-600
  --text-color: #f9fafb; // gray-50
  --indigo-100: #3730a3; // Veya farklı bir koyu ton
  --indigo-200: #4338ca;
  --indigo-600: #6366f1;
  --indigo-700: #4f46e5;
}

.react-select__control { // react-select için Tailwind ile stil vermek zorsa CSS kullanılabilir
    background-color: var(--input-bg) !important;
    border-color: var(--input-border) !important;
}
.react-select__single-value {
     color: var(--text-color) !important;
}
// ... diğer react-select sınıfları ...
*/