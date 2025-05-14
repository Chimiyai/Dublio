// src/components/admin/EditProjectForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, FormEvent, useEffect } from 'react';
import { Project, DubbingArtist, RoleInProject, Prisma } from '@prisma/client';
import Select from 'react-select';
import ImageUploader from '@/components/admin/ImageUploader';
import toast from 'react-hot-toast';

// Bu tip, hem yeni hem de düzenleme için kullanılabilir.
// id ve bazı metadata alanları opsiyonel olacak.
export interface ProjectFormData {
  id?: number; // Düzenlemede var, yenide yok
  title: string;
  slug: string;
  type: ProjectTypeEnum;
  description: string | null;
  coverImagePublicId: string | null;
  bannerImagePublicId?: string | null; // Opsiyonel ise
  releaseDate: Date | string | null; // Formda string, API'ye Date
  isPublished: boolean;
  assignments: { artistId: number; role: RoleInProject; artistName?: string }[]; // artistName frontend için
  createdAt?: Date; // Sadece düzenlemede gelir
  updatedAt?: Date; // Sadece düzenlemede gelir
}

// Bu tipi Project modelinden türetmek ve bazı alanları opsiyonel yapmak daha iyi olabilir
// Örnek: export type ProjectFormData = Partial<Project> & { type: ProjectTypeEnum; assignments: ... } ...
// Şimdilik yukarıdaki gibi manuel tanımlayalım.

export type ProjectTypeEnum = 'game' | 'anime';

interface EditProjectFormProps {
  project: ProjectFormData; // Gelen proje verisi (yeni için boş, düzenleme için dolu)
  allArtists: { id: number; firstName: string; lastName: string }[]; // Sadece gerekli alanlar
  availableRoles: RoleInProject[];
  isEditing: boolean; // Formun modunu belirler
}

// API'ye gönderilecek payload tipi (assignments olmadan, çünkü o backend'de ayrı işleniyor)
// Veya önceki ProjectUpdatePayload tipini de kullanabiliriz, ama assignments'ı API'ye farklı gönderiyoruz.
// En iyisi backend'in Zod şemasının beklediği payload'u burada da tanımlamak.
interface ApiProjectPayload {
  title?: string;
  slug?: string;
  type?: ProjectTypeEnum;
  description?: string | null;
  coverImagePublicId?: string | null;
  releaseDate?: string | Date | null; // API'ye gönderirken Date'e çevrilecek
  isPublished?: boolean;
  // assignments frontend'den API'ye düz array olarak gidecek
  assignments?: { artistId: number; role: RoleInProject }[];
}


// Formdaki hatalar için interface (önceki gibi)
interface FormErrors {
  title?: string[];
  slug?: string[];
  type?: string[];
  description?: string[];
  coverImagePublicId?: string[];
  releaseDate?: string[];
  isPublished?: string[];
  assignments?: string[];
  general?: string;
}

const getArchivePublicId = (oldPublicId: string, typePrefix: string) => {
  // ... (bu fonksiyon aynı kalabilir)
  if (!oldPublicId) return null;
  const baseArchiveFolder = 'kullanilmayanlar';
  const subFolder = typePrefix;
  let filenamePart = oldPublicId;
  let originalFolderPath = '';
  if (oldPublicId.includes('/')) {
      const parts = oldPublicId.split('/');
      filenamePart = parts.pop() || oldPublicId;
      if (parts.length > 0) {
          originalFolderPath = parts.join('/') + '/';
      }
  }
  return `${baseArchiveFolder}/${originalFolderPath}${subFolder}_${filenamePart}_${Date.now()}`.substring(0, 200);
};

export default function EditProjectForm({
  project,
  allArtists,
  availableRoles,
  isEditing,
}: EditProjectFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(project.title || '');
  const [slug, setSlug] = useState(project.slug || '');
  const [type, setType] = useState<ProjectTypeEnum>(project.type || 'game');
  const [description, setDescription] = useState(project.description || '');
  const [formCoverPublicId, setFormCoverPublicId] = useState<string | null>(project.coverImagePublicId || null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [releaseDate, setReleaseDate] = useState(
    project.releaseDate
      ? (typeof project.releaseDate === 'string' ? project.releaseDate : new Date(project.releaseDate).toISOString().split('T')[0])
      : ''
  );
  const [isPublished, setIsPublished] = useState(
    project.isPublished === undefined ? true : project.isPublished
  );

  const [currentAssignments, setCurrentAssignments] = useState<ProjectFormData['assignments']>(() => {
    const initialAssignments = project.assignments || [];
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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // project prop'u değiştiğinde state'leri güncelle
    // Bu, özellikle düzenleme sayfasında slug değiştiğinde ve sayfa yeniden yüklendiğinde önemli.
    // Yeni proje için zaten başlangıç değerleriyle geliyor.
    if (isEditing) { // Sadece düzenleme modunda prop'tan gelenlerle senkronize et
        setTitle(project.title || '');
        setSlug(project.slug || '');
        setType(project.type || 'game');
        setDescription(project.description || '');
        setReleaseDate(project.releaseDate ? (typeof project.releaseDate === 'string' ? project.releaseDate : new Date(project.releaseDate).toISOString().split('T')[0]) : '');
        setIsPublished(project.isPublished === undefined ? true : project.isPublished);

        if (!selectedCoverFile && (project.coverImagePublicId || null) !== formCoverPublicId) {
            setFormCoverPublicId(project.coverImagePublicId || null);
        }

        const initialAssignments = project.assignments || [];
        setCurrentAssignments(initialAssignments.map(a => {
            const artist = allArtists.find(art => art.id === a.artistId);
            return { artistId: a.artistId, role: a.role, artistName: artist ? `${artist.firstName} ${artist.lastName}` : 'Bilinmeyen Sanatçı' };
        }));
    }
    // Yeni ekleme modunda bu useEffect'in başlangıç state'lerini bozmaması için
    // bağımlılıkları dikkatli seçmek veya koşulu daraltmak gerekebilir.
    // Şimdilik `project.id` değiştiğinde (yani farklı bir proje düzenlemeye geçildiğinde) çalışsın.
    // Veya sadece `project` objesinin referansı değiştiğinde.
  }, [project, isEditing, allArtists, selectedCoverFile, formCoverPublicId]); // `formCoverPublicId`'yi kaldırdım, `project.coverImagePublicId`'ye bağlı olmalı. `selectedCoverFile` ekli.

  const addAssignment = () => {
    // ... (bu fonksiyon aynı kalabilir)
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
    setErrors(prev => ({...prev, assignments: undefined }));
    setSelectedArtistToAdd(null);
    setSelectedRoleToAdd('');
  };

  const removeAssignment = (artistId: number, role: RoleInProject) => {
    // ... (bu fonksiyon aynı kalabilir)
    setCurrentAssignments(prev =>
        prev.filter(a => !(a.artistId === artistId && a.role === role))
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    if (!title.trim() || !slug.trim() || !releaseDate) {
      toast.error("Başlık, slug ve yayın tarihi zorunludur.");
      return;
    }
    // ... diğer zorunlu alan kontrolleri ...

    const loadingToastId = toast.loading(isEditing ? 'Proje güncelleniyor...' : 'Proje oluşturuluyor...');
    startTransition(async () => {
      let finalImagePublicIdToSave = formCoverPublicId;
      let newPublicIdFromUpload: string | null = null;
      const originalDbPublicId = isEditing ? project.coverImagePublicId || null : null;
      let oldPublicIdToArchive: string | null = null;

      if (selectedCoverFile) {
        const formData = new FormData();
        formData.append('imageFile', selectedCoverFile);
        formData.append('uploadContext', 'projectCover');
        let identifierValue: string;
        if (slug.trim()) {
          identifierValue = slug.trim();
        } else if (title.trim()) {
          identifierValue = title.trim().toLowerCase().replace(/\s+/g, '-'); // Başlıktan slug benzeri bir şey üret
        } else if (isEditing && project.id) {
          identifierValue = project.id.toString();
        } else {
          identifierValue = `new-project-${Date.now()}`; // Veya daha anlamlı bir varsayılan
        }

        formData.append('identifier', identifierValue);
        try {
          toast.loading("Kapak resmi Cloudinary'ye yükleniyor...", { id: 'project-upload-toast' });
          const uploadResponse = await fetch('/api/image-upload', { method: 'POST', body: formData });
          const uploadData = await uploadResponse.json();
          toast.dismiss('project-upload-toast');

          if (!uploadResponse.ok) throw new Error(uploadData.message || 'Kapak resmi yüklenemedi.');

          newPublicIdFromUpload = uploadData.publicId;
          finalImagePublicIdToSave = newPublicIdFromUpload;
          toast.success('Kapak resmi Cloudinary\'ye yüklendi.');

          if (isEditing && originalDbPublicId && originalDbPublicId !== newPublicIdFromUpload) {
            oldPublicIdToArchive = originalDbPublicId;
          }
          setFormCoverPublicId(newPublicIdFromUpload);
        } catch (uploadError: any) {
          toast.dismiss(loadingToastId);
          toast.error(uploadError.message || 'Resim yüklenirken hata.');
          setErrors(prev => ({ ...prev, coverImagePublicId: [uploadError.message] }));
          return;
        }
      }

      // API'ye gönderilecek temel proje verileri
      const projectPayload: ApiProjectPayload = {
        title,
        slug,
        type,
        description: description.trim() === '' ? null : description.trim(),
        coverImagePublicId: finalImagePublicIdToSave, // Resim yüklendiyse yeni ID, yoksa mevcut ID
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : null,
        isPublished,
        assignments: currentAssignments.map(({ artistId, role }) => ({ artistId, role })), // Sadece ID ve rol gönder
      };

      // Düzenleme modunda, sadece değişen alanları gönderelim (opsiyonel iyileştirme,
      // ama backend zaten bunu kontrol ediyor, bu yüzden tüm payload'u göndermek daha basit olabilir)
      // Ya da backend'deki gibi bir `hasChanges` mantığı kurabiliriz.
      // Şimdilik tüm payload'u gönderelim, backend Zod ile parse edecek.

      // API endpoint ve methodunu belirle
      const apiUrl = isEditing ? `/api/admin/projects/${project.slug}` : '/api/admin/projects';
      const apiMethod = isEditing ? 'PUT' : 'POST';

      // Eski resmi arşivle (sadece düzenleme ve resim değiştiyse)
      if (isEditing && oldPublicIdToArchive) {
        const archiveTargetId = getArchivePublicId(oldPublicIdToArchive, 'projeler');
        if (archiveTargetId) {
            try {
                console.log(`ESKİ PROJE KAPAK RESMİ ARŞİVLENECEK: ${oldPublicIdToArchive} -> ${archiveTargetId}`);
                // Gerçek arşivleme API çağrısı:
                // await fetch('/api/admin/cloudinary-utils/archive-image', {
                //   method: 'POST',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify({ currentPublicId: oldPublicIdToArchive, newPublicId: archiveTargetId }),
                // });
                // Backend zaten PUT isteğinde bunu yapıyor, burada tekrar yapmaya gerek YOK.
                // Sadece backend'in bu `oldPublicIdToArchive` bilgisini alması gerekiyor.
                // Bu bilgi, `projectPayload`'a eklenebilir veya backend kendi bulur.
                // Backend zaten `currentProject.coverImagePublicId` ile yeni gelen `coverImagePublicId`'yi karşılaştırıp arşivi yapıyor.
            } catch (e) { console.error("Arşivleme API çağrı hatası (frontend):", e); }
        }
      }

      try {
        const response = await fetch(apiUrl, {
          method: apiMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectPayload),
        });
        const data = await response.json();

        if (!response.ok) {
          toast.dismiss(loadingToastId);
          if (data.errors) setErrors(data.errors);
          else setErrors({ general: data.message || (isEditing ? 'Proje güncellenemedi.' : 'Proje oluşturulamadı.') });
          // throw new Error(data.message || (isEditing ? 'Proje güncellenemedi.' : 'Proje oluşturulamadı.')); // Bu satır toast'tan sonra gereksiz
          return; // Hata durumunda fonksiyondan çık
        }

        toast.dismiss(loadingToastId);
        toast.success(`Proje başarıyla ${isEditing ? 'güncellendi' : 'oluşturuldu'}.`);
        setSelectedCoverFile(null); // Seçili dosyayı temizle

        if (isEditing) {
            if (data.slug && data.slug !== project.slug) { // Slug değiştiyse yeni slug'a yönlendir
                router.push(`/admin/projeler/duzenle/${data.slug}`);
            }
            router.refresh(); // Her zaman refresh et
        } else {
            // Yeni proje oluşturulduktan sonra proje listesine veya proje detayına yönlendir
            router.push('/admin/projeler'); // Veya `/admin/projeler/duzenle/${data.slug}`
            router.refresh();
        }

      } catch (err: any) {
        toast.dismiss(loadingToastId);
        toast.error(err.message || 'Bir ağ hatası oluştu.');
        if(err.errors) setErrors(err.errors); else setErrors({ general: err.message });
      }
    });
  };

  const artistOptions = allArtists.map(artist => ({ value: artist.id, label: `${artist.firstName} ${artist.lastName}` }));

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl">
      {/* ... (Form elemanları aynı kalacak, value'lar state'lerden gelecek) ... */}
      {/* Sadece Kaydet Butonu Metni Değişecek */}
       {errors.general && (
         <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300" role="alert">
            {errors.general}
         </div>
      )}
      {/* Başlık, slug, tür, yayın tarihi, açıklama inputları (önceki gibi) */}
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
            <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as ProjectTypeEnum)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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
        <div className="sm:col-span-6">
             <ImageUploader
                currentImagePublicId={formCoverPublicId}
                onFileSelect={(file) => {
                    setSelectedCoverFile(file);
                    if (file) {
                        // ImageUploader yeni seçilen dosyayı önizleyecek,
                        // bu yüzden formCoverPublicId'yi null yapabiliriz ki mevcut resmi göstermesin.
                        // Ancak ImageUploader'ın kendi içinde bir "mevcut resim" ve "yeni seçilen" mantığı olmalı.
                        // Şimdilik böyle bırakalım, ImageUploader'ın davranışına göre ayarlanır.
                        setFormCoverPublicId(null); // Veya ImageUploader'a bırak
                    } else {
                        // Dosya seçimi iptal edilirse, orijinal (veya DB'deki) resme dön.
                        setFormCoverPublicId(project.coverImagePublicId || null);
                    }
                }}
                aspectRatio="aspect-[16/9]"
                label="Kapak Resmi"
                maxFileSizeMB={8}
            />
            {errors.coverImagePublicId && <p className="mt-1 text-xs text-red-600">{Array.isArray(errors.coverImagePublicId) ? errors.coverImagePublicId.join(', ') : errors.coverImagePublicId}</p>}
        </div>
         <div className="sm:col-span-6">
             <div className="flex items-center">
                <input id="isPublished" name="isPublished" type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"/>
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Yayında</label>
             </div>
             {errors.isPublished && <p className="mt-1 text-xs text-red-600">{Array.isArray(errors.isPublished) ? errors.isPublished.join(', ') : errors.isPublished}</p>}
         </div>
      </div>

      {/* Proje Katılımcıları ve Rolleri (önceki gibi) */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">Proje Katılımcıları ve Rolleri</h3>
          {errors.assignments && <p className="mt-2 text-sm text-red-600">{Array.isArray(errors.assignments) ? errors.assignments.join(', ') : errors.assignments}</p>}
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
          <div className="flex flex-col sm:flex-row items-end gap-4 pt-4 border-t dark:border-gray-600">
              <div className='flex-grow'>
                   <label htmlFor='select-artist-to-add' className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sanatçı Seç</label>
                   <Select /* ...props... */
                       instanceId="select-artist-to-add"
                       inputId='select-artist-to-add'
                       options={artistOptions}
                       value={selectedArtistToAdd}
                       onChange={(option) => setSelectedArtistToAdd(option)}
                       placeholder="Sanatçı ara veya seç..."
                       isClearable
                       isDisabled={isPending}
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
                       className="text-sm"
                       classNamePrefix="react-select"
                   />
              </div>
               <div className='w-full sm:w-auto'>
                   <label htmlFor="select-role-to-add" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol Seç</label>
                   <select /* ...props... */
                      id="select-role-to-add"
                      value={selectedRoleToAdd}
                      onChange={(e) => setSelectedRoleToAdd(e.target.value as RoleInProject)}
                      disabled={isPending}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white h-[38px]"
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

      <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
          >
            {isPending
              ? isEditing
                ? 'Güncelleniyor...'
                : 'Oluşturuluyor...'
              : isEditing
              ? 'Değişiklikleri Kaydet'
              : 'Projeyi Oluştur'}
          </button>
        </div>
      </div>
    </form>
  );
}