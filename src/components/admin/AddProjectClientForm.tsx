// src/components/admin/AddProjectClientForm.tsx
'use client';

import { useState, FormEvent, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';
import Select from 'react-select';
import { DubbingArtist, RoleInProject } from '@prisma/client';
import toast from 'react-hot-toast';

interface AddProjectClientFormProps {
  allArtists: Pick<DubbingArtist, "id" | "firstName" | "lastName">[];
  availableRoles: RoleInProject[];
}

interface CurrentAssignment {
    artistId: number;
    role: RoleInProject;
    artistName?: string;
}

interface ProjectFormErrors {
  title?: string[];
  slug?: string[];
  type?: string[];
  releaseDate?: string[];
  coverImagePublicId?: string[];
  assignments?: string[];
  general?: string;
}

export default function AddProjectClientForm({ allArtists, availableRoles }: AddProjectClientFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'oyun' | 'anime'>('oyun');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  // Bu state, ImageUploader'a prop olarak geçilecek ve form kaydedilirken kullanılacak
  const [currentCoverPublicId, setCurrentCoverPublicId] = useState<string | null>(null);

  const [currentAssignments, setCurrentAssignments] = useState<CurrentAssignment[]>([]);
  const [selectedArtistToAdd, setSelectedArtistToAdd] = useState<{ value: number; label: string } | null>(null);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<RoleInProject | ''>('');
  
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isPending, startTransition] = useTransition();

  const generateSlug = (text: string) => {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(generateSlug(newTitle));
  };

  const addAssignment = () => {
    if (!selectedArtistToAdd || !selectedRoleToAdd) {
      setErrors(prev => ({...prev, assignments: ["Lütfen bir sanatçı ve rol seçin."]}));
      return;
    }
    if (currentAssignments.some(a => a.artistId === selectedArtistToAdd.value && a.role === selectedRoleToAdd)) {
      setErrors(prev => ({...prev, assignments: ["Bu sanatçı bu rolle zaten atanmış."]}));
      return;
    }
    setCurrentAssignments(prev => [...prev, { artistId: selectedArtistToAdd.value, role: selectedRoleToAdd, artistName: selectedArtistToAdd.label }]);
    setErrors(prev => ({ ...prev, assignments: undefined }));
    setSelectedArtistToAdd(null);
    setSelectedRoleToAdd('');
  };

  const removeAssignment = (artistId: number, role: RoleInProject) => {
    setCurrentAssignments(prev => prev.filter(a => !(a.artistId === artistId && a.role === role)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!title || !slug || !type || !releaseDate) {
      toast.error('Başlık, slug, tür ve yayın tarihi alanları zorunludur.');
      return;
    }
    let releaseDateObj;
    try {
      releaseDateObj = new Date(releaseDate);
      if (isNaN(releaseDateObj.getTime())) throw new Error('Geçersiz tarih.');
    } catch {
      toast.error('Geçersiz yayın tarihi formatı.');
      return;
    }

    const loadingToastId = toast.loading('Proje oluşturuluyor...');
    startTransition(async () => {
      let finalCoverImagePublicId: string | null = null; 
      let uploadToastId: string | undefined;

      try {
        if (selectedCoverFile) {
          uploadToastId = toast.loading("Kapak resmi Cloudinary'ye yükleniyor...", { id: 'project-cover-upload-toast' });
          const formData = new FormData();
          formData.append('imageFile', selectedCoverFile);
          formData.append('uploadContext', 'projectCover'); // Genel API için context
          formData.append('identifier', slug || title || 'yeni_proje');
          
          const uploadRes = await fetch('/api/image-upload', { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          toast.dismiss(uploadToastId);

          if (!uploadRes.ok) throw new Error(uploadData.message || 'Kapak resmi yüklenemedi.');
          finalCoverImagePublicId = uploadData.publicId;
          toast.success('Kapak resmi Cloudinary\'ye yüklendi.');
          setCurrentCoverPublicId(finalCoverImagePublicId); // Form state'ini güncelle
        }
        
        const projectPayload = {
          title,
          slug,
          type,
          description: description.trim() === '' ? null : description,
          coverImagePublicId: finalCoverImagePublicId,
          releaseDate: releaseDateObj.toISOString(),
          isPublished,
          assignments: currentAssignments.map(({ artistId, role }) => ({ artistId, role })),
        };

        const response = await fetch('/api/admin/projects', { // Proje ekleme API'si
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectPayload),
        });
        const data = await response.json();

        if (!response.ok) {
          if (data.errors) setErrors(data.errors);
          throw new Error(data.message || 'Proje oluşturulamadı.');
        }

        toast.success('Proje başarıyla oluşturuldu!');
        router.push('/admin/projeler');
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || 'Bir hata oluştu.');
        if (err.errors) setErrors(err.errors);
      } finally {
        toast.dismiss(loadingToastId);
      }
    });
  };
  
  const artistOptions = allArtists.map(artist => ({
    value: artist.id,
    label: `${artist.firstName} ${artist.lastName}`
  }));

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 space-y-6">
      {errors.general && <div className="p-3 bg-red-100 ...">{errors.general}</div>}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlık <span className="text-red-500">*</span></label>
        <input type="text" name="title" id="title" value={title} onChange={handleTitleChange} required className="mt-1 block w-full ..."/>
        {errors.title && <p className="mt-1 text-xs text-red-600">{Array.isArray(errors.title) ? errors.title.join(', ') : errors.title}</p>}
      </div>
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL Metni (Slug) <span className="text-red-500">*</span></label>
        <input type="text" name="slug" id="slug" value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} placeholder="baslik-buraya-kucuk-harf-tireli" required className="mt-1 block w-full ..."/>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">URL'de görünecek kısım.</p>
        {errors.slug && <p className="mt-1 text-xs text-red-600">{Array.isArray(errors.slug) ? errors.slug.join(', ') : errors.slug}</p>}
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tür <span className="text-red-500">*</span></label>
        <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as 'oyun' | 'anime')} required className="mt-1 block w-full ...">
          <option value="oyun">Oyun</option>
          <option value="anime">Anime</option>
        </select>
        {errors.type && <p className="mt-1 text-xs text-red-600">{Array.isArray(errors.type) ? errors.type.join(', ') : errors.type}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
        <textarea id="description" name="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full ..."/>
      </div>
      
      <ImageUploader
        currentImagePublicId={currentCoverPublicId} // Formun state'inden
        onFileSelect={(file) => {
          setSelectedCoverFile(file);
          if (file) {
            setCurrentCoverPublicId(null); // Yeni dosya seçildi, data URL önizlemesi için
          } else {
            setCurrentCoverPublicId(null); // Seçim iptal, başlangıçta da null'dı
          }
        }}
        aspectRatio="aspect-[16/9]"
        label="Kapak Resmi"
        maxFileSizeMB={8} // API'deki projectCover context'i ile uyumlu
      />
      {errors.coverImagePublicId && <p className="mt-1 text-xs text-red-600">{Array.isArray(errors.coverImagePublicId) ? errors.coverImagePublicId.join(', ') : errors.coverImagePublicId}</p>}
      
      <div>
        <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yayın Tarihi <span className="text-red-500">*</span></label>
        <input type="date" name="releaseDate" id="releaseDate" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required className="mt-1 block w-full ..."/>
        {errors.releaseDate && <p className="mt-1 text-xs text-red-600">{Array.isArray(errors.releaseDate) ? errors.releaseDate.join(', ') : errors.releaseDate}</p>}
      </div>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input id="isPublished" name="isPublished" type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="focus:ring-indigo-500 h-4 w-4 ..."/>
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isPublished" className="font-medium text-gray-700 dark:text-gray-300">Yayında</label>
          <p className="text-gray-500 dark:text-gray-400">İşaretlenirse proje sitede görünür olur.</p>
        </div>
      </div>

      {/* Sanatçı Atama Bölümü */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">Proje Katılımcıları ve Rolleri</h3>
        {errors.assignments && <p className="mt-2 text-sm text-red-600">{Array.isArray(errors.assignments) ? errors.assignments.join(', ') : errors.assignments}</p>}
        <div className="mt-4 mb-6 space-y-2">
          {currentAssignments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Henüz katılımcı atanmadı.</p>
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
            <label htmlFor='select-artist-to-add-project' className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sanatçı Seç</label>
            <Select instanceId="select-artist-to-add-project" inputId='select-artist-to-add-project' options={artistOptions} value={selectedArtistToAdd} onChange={(option) => setSelectedArtistToAdd(option)} placeholder="Sanatçı seç..." isClearable isDisabled={isPending} className="text-sm" classNamePrefix="react-select" />
          </div>
          <div className='w-full sm:w-auto'>
            <label htmlFor="select-role-to-add-project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol Seç</label>
            <select id="select-role-to-add-project" value={selectedRoleToAdd} onChange={(e) => setSelectedRoleToAdd(e.target.value as RoleInProject)} disabled={isPending} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white h-[38px]">
              <option value="" disabled>Rol seç...</option>
              {availableRoles.map(role => (<option key={role} value={role}>{role.replace(/_/g, ' ')}</option>))}
            </select>
          </div>
          <button type="button" onClick={addAssignment} disabled={!selectedArtistToAdd || !selectedRoleToAdd || isPending} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 h-[38px] whitespace-nowrap">
            Ata
          </button>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end space-x-3">
          <Link href="/admin/projeler" className="bg-gray-200 dark:bg-gray-600 ...">İptal</Link>
          <button type="submit" disabled={isPending} className={`bg-green-600 hover:bg-green-700 ... ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isPending ? 'Kaydediliyor...' : 'Projeyi Kaydet'}
          </button>
        </div>
      </div>
    </form>
  );
}