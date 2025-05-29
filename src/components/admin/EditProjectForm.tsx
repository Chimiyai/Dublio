// src/components/admin/EditProjectForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, FormEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { RoleInProject, Prisma, Category } from '@prisma/client'; // Category Prisma'dan geliyorsa
import Select from 'react-select'; // Eğer kullanıyorsanız
import ImageUploader, { ImageUploaderProps } from '@/components/admin/ImageUploader';
import toast from 'react-hot-toast';


// Tipler
export type ProjectTypeEnum = 'oyun' | 'anime';

interface AssignmentFormData {
  artistId: number;
  role: RoleInProject;
  artistName?: string; // Sadece frontend gösterimi için
}

// Formun state'i ve initialData prop'u için ana tip
export interface ProjectFormData {
  id?: number;
  title: string;
  slug: string;
  type: ProjectTypeEnum;
  description: string | null;
  coverImagePublicId: string | null;
  bannerImagePublicId: string | null;
  releaseDate: string; // YYYY-MM-DD formatında
  isPublished: boolean;
  price: number | null;
  currency: string | null;
  assignments: AssignmentFormData[];
  categoryIds: number[];
  // API'den gelen proje verisi, kategorileri farklı bir formatta içerebilir
  categories?: { category: { id: number; name: string; /* slug?: string; */ } }[]; 
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface EditProjectFormProps {
  project?: ProjectFormData; // Düzenleme için (yeni için undefined)
  allArtists: { value: number; label: string }[]; // react-select için {value, label}
  allCategories: { value: number; label: string }[]; // react-select için {value, label}
  availableRoles: RoleInProject[];
  isEditing: boolean;
}

// Form hataları
interface FormErrors {
  title?: string[]; slug?: string[]; type?: string[]; description?: string[];
  coverImagePublicId?: string[]; bannerImagePublicId?: string[];
  releaseDate?: string[]; isPublished?: string[]; price?: string[]; currency?: string[];
  assignments?: string[]; categoryIds?: string[]; general?: string;
}

// API'ye gönderilecek payload (Zod şemasıyla eşleşmeli)
interface ApiPayload {
  title: string;
  slug: string;
  type: ProjectTypeEnum;
  description: string | null;
  coverImagePublicId: string | null;
  bannerImagePublicId: string | null;
  releaseDate: string | null; // ISO string formatında
  isPublished: boolean;
  price: number | null;
  currency: string | null;
  assignments: { artistId: number; role: RoleInProject }[];
  categoryIds: number[];
}

// getArchivePublicId fonksiyonu (Cloudinary'de eski resimleri arşivlemek için)
const getArchivePublicId = (oldPublicId: string, typePrefix: string): string | null => {
    if (!oldPublicId) return null;
    const baseArchiveFolder = 'kullanilmayanlar'; // Cloudinary'de bir klasör
    // Cloudinary public ID'leri genellikle klasör yolu içerebilir.
    // Örn: 'project_covers/my_awesome_game_cover_123'
    // Sadece dosya adını alıp, başına prefix ve timestamp ekleyip, orijinal klasör yolunu koruyalım.
    let filenamePart = oldPublicId;
    let originalFolderPath = '';

    if (oldPublicId.includes('/')) {
        const parts = oldPublicId.split('/');
        filenamePart = parts.pop() || oldPublicId; // Son kısım dosya adı
        if (parts.length > 0) {
            originalFolderPath = parts.join('/') + '/'; // Orijinal klasör yolu
        }
    }
    // Arşivlenmiş ID: kullanilmayanlar/orijinal_klasor_yolu/tipPrefix_orijinalDosyaAdi_timestamp
    const newPublicId = `${baseArchiveFolder}/${originalFolderPath}${typePrefix}_${filenamePart}_${Date.now()}`;
    return newPublicId.substring(0, 200); // Cloudinary public ID uzunluk sınırı
};


export default function EditProjectForm({
  project: initialProjectData,
  allArtists,
  allCategories: initialAllCategoriesData = [],
  availableRoles,
  isEditing,
}: EditProjectFormProps) {
  const router = useRouter();

  // Form State'leri
  const [title, setTitle] = useState(initialProjectData?.title || '');
  const [slug, setSlug] = useState(initialProjectData?.slug || '');
  const [projectType, setProjectType] = useState<ProjectTypeEnum>(initialProjectData?.type || 'oyun');
  const [description, setDescription] = useState(initialProjectData?.description || '');
  
  const [coverImagePublicId, setCoverImagePublicId] = useState<string | null>(initialProjectData?.coverImagePublicId || null);
  const [bannerImagePublicId, setBannerImagePublicId] = useState<string | null>(initialProjectData?.bannerImagePublicId || null);
  
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  
  const [releaseDate, setReleaseDate] = useState(
    initialProjectData?.releaseDate
      ? (typeof initialProjectData.releaseDate === 'string' 
          ? initialProjectData.releaseDate // Zaten YYYY-MM-DD ise
          : new Date(initialProjectData.releaseDate).toISOString().split('T')[0]) // Date ise çevir
      : ''
  );
  const [isPublished, setIsPublished] = useState(
    initialProjectData?.isPublished === undefined ? true : initialProjectData.isPublished
  );
  const [price, setPrice] = useState<string>(initialProjectData?.price?.toString() || '');
  const [currency, setCurrency] = useState<string>(initialProjectData?.currency || 'TRY');
  
  const [currentAssignments, setCurrentAssignments] = useState<AssignmentFormData[]>(() => {
    const assignmentsFromProp = initialProjectData?.assignments || [];
    return assignmentsFromProp.map(a => {
      const artist = allArtists.find(art => art.value === a.artistId);
      return { ...a, artistName: artist ? artist.label : `ID: ${a.artistId}` };
    });
  });
  
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    initialProjectData?.categoryIds || // Eğer formda direkt ID'ler varsa
    initialProjectData?.categories?.map((c: { category: { id: number } }) => c.category.id) || // Ya da API formatından map'le
    []
  );
  
  const [allCategoriesForSelect, setAllCategoriesForSelect] = useState(initialAllCategoriesData); // Prop'tan gelen zaten formatlı

  // Kategorileri API'den çekme useEffect'i (Bu sadece client'ta çalışır)
  // Eğer allCategories prop olarak gelmiyorsa veya güncellenmesi gerekiyorsa bu kullanılabilir.
  // Ancak admin sayfaları genellikle server component'ten veri alır.
  // Bu useEffect'i AddProjectPage veya EditProjectPage (ana sayfa component'leri)
  // tarafında yapıp EditProjectForm'a prop olarak geçmek daha iyi olabilir.
  // Şimdilik, initialAllCategoriesData'nın dolu geldiğini varsayıyoruz.
  // Eğer initialAllCategoriesData boş geliyorsa, burada fetch edilebilir:
  useEffect(() => {
    if (initialAllCategoriesData.length === 0) { // Sadece prop boşsa çek
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                if (res.ok) {
                    const data: {id: number, name: string}[] = await res.json();
                    setAllCategoriesForSelect(data.map(cat => ({ value: cat.id, label: cat.name })));
                } else {
                     console.error("Kategoriler çekilemedi (form içinde)");
                }
            } catch (error) { console.error("Kategoriler çekilemedi (form içinde)", error); }
        };
        fetchCategories();
    }
  }, [initialAllCategoriesData]);
  
  const [selectedArtistToAdd, setSelectedArtistToAdd] = useState<{ value: number; label: string } | null>(null);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<RoleInProject | ''>('');
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, startTransition] = useTransition();

  // initialProjectData veya isEditing değiştiğinde form state'lerini güncelle
  useEffect(() => {
    
    if (isEditing && initialProjectData) {
      setTitle(initialProjectData.title || '');
      setSlug(initialProjectData.slug || '');
      setProjectType(initialProjectData.type || 'oyun');
      setDescription(initialProjectData.description || '');
      setReleaseDate(initialProjectData.releaseDate ? (typeof initialProjectData.releaseDate === 'string' ? initialProjectData.releaseDate : new Date(initialProjectData.releaseDate).toISOString().split('T')[0]) : '');
      setIsPublished(initialProjectData.isPublished === undefined ? true : initialProjectData.isPublished);
      setPrice(initialProjectData.price?.toString() || '');
      setCurrency(initialProjectData.currency || 'TRY');
      setSelectedCategoryIds(initialProjectData.categoryIds || initialProjectData.categories?.map((c: { category: { id: number } }) => c.category.id) || []);

      // Sadece yeni dosya seçilmemişse mevcut ID'leri kullan
      if (!selectedCoverFile) setCoverImagePublicId(initialProjectData.coverImagePublicId || null);
      if (!selectedBannerFile) setBannerImagePublicId(initialProjectData.bannerImagePublicId || null);

      const assignmentsFromProp = initialProjectData.assignments || [];
      setCurrentAssignments(assignmentsFromProp.map(a => {
        const artist = allArtists.find(art => art.value === a.artistId);
        return { ...a, artistName: artist ? artist.label : `ID: ${a.artistId}` };
      }));
    } else if (!isEditing) { // Yeni proje modunda formu sıfırla (initialProjectData undefined ise)
        setTitle(''); setSlug(''); setProjectType('oyun'); setDescription('');
        setCoverImagePublicId(null); setBannerImagePublicId(null);
        setSelectedCoverFile(null); setSelectedBannerFile(null);
        setReleaseDate(''); setIsPublished(true); setPrice(''); setCurrency('TRY');
        setCurrentAssignments([]); setSelectedCategoryIds([]);
    }
  }, [initialProjectData, isEditing, allArtists]); // selectedFile bağımlılıkları çıkarıldı, kullanıcı aksiyonuyla değişmeliler


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
        { artistId: selectedArtistToAdd.value, role: selectedRoleToAdd, artistName: selectedArtistToAdd.label }
    ]);
    setErrors(prev => ({...prev, assignments: undefined }));
    setSelectedArtistToAdd(null);
    setSelectedRoleToAdd('');
  };

  const removeAssignment = (artistId: number, role: RoleInProject) => {
    setCurrentAssignments(prev =>
        prev.filter(a => !(a.artistId === artistId && a.role === role))
    );
  };

  // Resim yükleme işlemini yönetecek yardımcı fonksiyon
  const handleImageUpload = async (
    file: File, 
    uploadContext: 'projectCover' | 'projectBanner', // Hangi tür resim olduğu
    identifierSeed: string, // Slug veya title gibi bir şey
    existingProjectId?: number // Düzenleme modunda proje ID'si
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append('imageFile', file);
    formData.append('uploadContext', uploadContext); // Backend'e hangi tür resim olduğunu bildirmek için
    
    let identifier = identifierSeed.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]+/g, '');
    if (!identifier && isEditing && existingProjectId) {
        identifier = existingProjectId.toString();
    } else if (!identifier) {
        identifier = `new-${uploadContext}-${Date.now()}`;
    }
    formData.append('identifier', identifier);
    formData.append('folder', uploadContext === 'projectCover' ? 'project_covers' : 'project_banners');

    const toastId = toast.loading(`${uploadContext === 'projectCover' ? 'Kapak' : 'Banner'} resmi yükleniyor...`);
    try {
      // API endpoint'i /api/admin/projects/cover-image/route.ts veya genel bir /api/image-upload olabilir.
      // cover-image endpoint'i genel bir resim yükleyiciyse onu kullanalım.
      const uploadResponse = await fetch('/api/admin/projects/cover-image', {
          method: 'POST', 
          body: formData 
      });
      const uploadData = await uploadResponse.json();
      toast.dismiss(toastId);

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || `${uploadContext === 'projectCover' ? 'Kapak' : 'Banner'} resmi yüklenemedi.`);
      }
      toast.success(`${uploadContext === 'projectCover' ? 'Kapak' : 'Banner'} resmi başarıyla yüklendi.`);
      return uploadData.publicId; // API'nizin publicId döndürdüğünü varsayıyorum
    } catch (uploadError: any) {
      toast.dismiss(toastId);
      toast.error(uploadError.message);
      setErrors(prev => ({ ...prev, [uploadContext === 'projectCover' ? 'coverImagePublicId' : 'bannerImagePublicId']: [uploadError.message] }));
      return null;
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    if (!title.trim() || !slug.trim() || !releaseDate) {
      toast.error("Başlık, slug ve yayın tarihi alanları zorunludur.");
      setErrors(prev => ({
        ...prev,
        title: !title.trim() ? ["Başlık zorunludur."] : undefined,
        slug: !slug.trim() ? ["Slug zorunludur."] : undefined,
        releaseDate: !releaseDate ? ["Yayın tarihi zorunludur."] : undefined,
      }));
      return;
    }
    if (projectType === 'oyun' && price.trim() !== '' && parseFloat(price) < 0) {
    toast.error("Oyun fiyatı 0 veya pozitif bir değer olmalıdır.");
    setErrors(prev => ({ ...prev, price: ["Fiyat 0 veya pozitif olmalı."] }));
    return;
}
    if (projectType === 'oyun' && price.trim() !== '' && currency.trim().length !== 3) {
        toast.error("Para birimi 3 karakter olmalıdır (örn: TRY).");
        setErrors(prev => ({ ...prev, currency: ["Para birimi 3 karakter olmalı."] }));
        return;
    }


    const loadingToastId = toast.loading(isEditing ? 'Proje güncelleniyor...' : 'Proje oluşturuluyor...');
    
    startTransition(async () => {
      let finalCoverIdToSubmit = coverImagePublicId; // Mevcut veya önceden yüklenmiş
      if (selectedCoverFile) {
        const uploadedId = await handleImageUpload(selectedCoverFile, 'projectCover', slug || title, initialProjectData?.id);
        if (!uploadedId) { toast.dismiss(loadingToastId); return; } // Yükleme başarısızsa dur
        finalCoverIdToSubmit = uploadedId;
        // Eski cover'ı arşivleme/silme işlemini backend (PUT isteği) halledecek
      }

      let finalBannerIdToSubmit = bannerImagePublicId; // Mevcut veya önceden yüklenmiş
      if (selectedBannerFile) {
        const uploadedId = await handleImageUpload(selectedBannerFile, 'projectBanner', slug || title, initialProjectData?.id);
        if (!uploadedId) { toast.dismiss(loadingToastId); return; } // Yükleme başarısızsa dur
        finalBannerIdToSubmit = uploadedId;
        // Eski banner'ı arşivleme/silme işlemini backend (PUT isteği) halledecek
      }

      const payload: ApiPayload = {
        title: title.trim(),
        slug: slug.trim(),
        type: projectType,
        description: description.trim() === '' ? null : description.trim(),
        coverImagePublicId: finalCoverIdToSubmit,
        bannerImagePublicId: finalBannerIdToSubmit,
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : null,
        isPublished,
        price: projectType === 'oyun' && price.trim() !== '' ? parseFloat(price) : null,
        currency: projectType === 'oyun' && currency.trim() !== '' ? currency.trim().toUpperCase() : null,
        assignments: currentAssignments.map(({ artistId, role }) => ({ artistId, role })),
        categoryIds: selectedCategoryIds,
      };

      const apiUrl = isEditing ? `/api/admin/projects/${initialProjectData?.slug}` : '/api/admin/projects';
      const apiMethod = isEditing ? 'PUT' : 'POST';

      try {
        const response = await fetch(apiUrl, {
          method: apiMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        toast.dismiss(loadingToastId);

        if (!response.ok) {
          if (data.errors && typeof data.errors === 'object') {
            setErrors(data.errors as FormErrors); // Gelen hataları state'e set et
            // Zod'dan gelen ilk field error'u toast ile göster
            const firstErrorField = Object.keys(data.errors)[0] as keyof FormErrors;
            if (firstErrorField && data.errors[firstErrorField]?.[0]) {
                 toast.error(`${firstErrorField.charAt(0).toUpperCase() + firstErrorField.slice(1)}: ${data.errors[firstErrorField][0]}`);
            } else {
                 toast.error(data.message || 'Bir hata oluştu.');
            }
          } else {
            setErrors({ general: data.message || 'Bir hata oluştu.' });
            toast.error(data.message || 'Bir hata oluştu.');
          }
          return;
        }

        toast.success(`Proje başarıyla ${isEditing ? 'güncellendi' : 'oluşturuldu'}.`);
        setSelectedCoverFile(null); // Seçili dosyaları temizle
        setSelectedBannerFile(null);
        // Formu sıfırlamak veya yeni verilerle güncellemek için state'leri güncelleyebiliriz
        // veya router.refresh() ile sunucudan en güncel veriyi almasını sağlayabiliriz.

        if (isEditing) {
          if (data.slug && data.slug !== initialProjectData?.slug) { // Eğer slug değiştiyse
            router.push(`/admin/projeler/duzenle/${data.slug}`); // Yeni slug'a yönlendir
          } else {
            router.refresh(); // Mevcut sayfayı yenile (sunucudan güncel veri için)
          }
        } else {
          router.push(`/admin/projeler/duzenle/${data.slug}`); // Yeni oluşturulan projenin düzenleme sayfasına git
        }
      } catch (err: any) {
        toast.dismiss(loadingToastId);
        toast.error(err.message || 'Bir ağ hatası oluştu.');
        setErrors({ general: 'Bir ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin.' });
      }
    });
  };

  const artistOptions = allArtists; // Zaten {value, label} formatında geliyor

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {errors.general && (
         <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300" role="alert">
            {errors.general}
         </div>
      )}

      {/* Bölüm 1: Temel Proje Bilgileri */}
      <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
        <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">
          Proje Detayları
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
          Projenin başlığı, slug'ı, türü gibi temel bilgiler.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Başlık <span className="text-red-500">*</span></label>
            <div className="mt-2">
              <input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required 
                     className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800" />
            </div>
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.join(', ')}</p>}
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="slug" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Slug <span className="text-red-500">*</span></label>
            <div className="mt-2">
              <input type="text" name="slug" id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} required 
                     className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800" />
            </div>
            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.join(', ')}</p>}
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Tür <span className="text-red-500">*</span></label>
            <div className="mt-2">
              <select id="type" name="type" value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectTypeEnum)} required 
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800">
                <option value="oyun">Oyun</option>
                <option value="anime">Anime</option>
              </select>
            </div>
            {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type.join(', ')}</p>}
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="releaseDate" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Yayın Tarihi <span className="text-red-500">*</span></label>
            <div className="mt-2">
              <input type="date" name="releaseDate" id="releaseDate" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required 
                     className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800" />
            </div>
            {errors.releaseDate && <p className="mt-1 text-xs text-red-500">{errors.releaseDate.join(', ')}</p>}
          </div>

          <div className="col-span-full">
            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Açıklama</label>
            <div className="mt-2">
              <textarea id="description" name="description" rows={4} value={description || ''} onChange={(e) => setDescription(e.target.value)} 
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800"></textarea>
            </div>
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.join(', ')}</p>}
          </div>
        </div>
      </div>

      {/* Bölüm 2: Görseller */}
      <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
        <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">Görseller</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
          Projenin kapak ve banner resimleri.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Kapak Resmi</label>
                <ImageUploader
                    currentImagePublicId={coverImagePublicId}
                    onFileSelect={(file) => {
                        setSelectedCoverFile(file);
                        if (file) setCoverImagePublicId(URL.createObjectURL(file)); // Geçici önizleme için URL oluştur
                        else setCoverImagePublicId(initialProjectData?.coverImagePublicId || null);
                    }}
                    aspectRatio="aspect-[16/9]" // Veya 4/3 gibi
                    label="Kapak Resmi Yükle / Değiştir"
                    maxFileSizeMB={5}
                />
                {errors.coverImagePublicId && <p className="mt-1 text-xs text-red-500">{errors.coverImagePublicId.join(', ')}</p>}
            </div>

            <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Banner Resmi</label>
                <ImageUploader
                    currentImagePublicId={bannerImagePublicId}
                    onFileSelect={(file) => {
                        setSelectedBannerFile(file);
                        if (file) setBannerImagePublicId(URL.createObjectURL(file)); // Geçici önizleme
                        else setBannerImagePublicId(initialProjectData?.bannerImagePublicId || null);
                    }}
                    aspectRatio="aspect-[21/9]" // Daha geniş bir banner oranı
                    label="Banner Resmi Yükle / Değiştir"
                    maxFileSizeMB={8}
                />
                {errors.bannerImagePublicId && <p className="mt-1 text-xs text-red-500">{errors.bannerImagePublicId.join(', ')}</p>}
            </div>
        </div>
      </div>
      
      {/* Bölüm 3: Fiyatlandırma (Sadece oyunlar için) */}
      {projectType === 'oyun' && (
        <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
          <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">Fiyatlandırma</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
            Bu oyun için bir fiyat belirleyin (sadece oyunlar için geçerlidir).
          </p>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="price" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Fiyat</label>
              <div className="mt-2">
                <input type="number" name="price" id="price" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} 
                       className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800" 
                       placeholder="0.00"/>
              </div>
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.join(', ')}</p>}
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="currency" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Para Birimi</label>
              <div className="mt-2">
                <input type="text" name="currency" id="currency" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} 
                       className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800" 
                       placeholder="TRY"/>
              </div>
              {errors.currency && <p className="mt-1 text-xs text-red-500">{errors.currency.join(', ')}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Bölüm 4: Kategoriler */}
      <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
        <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">Kategoriler</h2>
        <div className="mt-4">
          <Select
            instanceId="select-project-categories"
            isMulti
            options={allCategoriesForSelect || []} // <<<< UNDEFINED İSE BOŞ DİZİ KULLAN
            // value prop'u için de kontrol ekle
            value={allCategoriesForSelect && selectedCategoryIds 
                ? allCategoriesForSelect.filter(option => selectedCategoryIds.includes(option.value)) 
                : []
            }
            onChange={(selectedOptions) => {
                setSelectedCategoryIds(selectedOptions ? selectedOptions.map(option => option.value) : []);
            }}
            placeholder="Kategori seçin veya arayın..."
            className="react-select-container dark:text-gray-100"
            classNamePrefix="react-select"
            styles={{ // Basit dark mode stilleri (daha da özelleştirilebilir)
                control: (base, state) => ({ ...base, backgroundColor: 'var(--input-bg-dark)', borderColor: state.isFocused ? 'var(--indigo-500)' : 'var(--border-dark)', '&:hover': { borderColor: 'var(--border-dark-hover)'}, boxShadow: state.isFocused ? '0 0 0 1px var(--indigo-500)' : 'none' }),
                menu: base => ({ ...base, backgroundColor: 'var(--menu-bg-dark)' }),
                option: (base, { isFocused, isSelected }) => ({ ...base, backgroundColor: isSelected ? 'var(--indigo-600)' : isFocused ? 'var(--menu-item-hover-bg-dark)' : 'var(--menu-bg-dark)', color: isSelected ? 'white' : 'var(--text-light)', '&:active': { backgroundColor: 'var(--indigo-700)'} }),
                multiValue: base => ({ ...base, backgroundColor: 'var(--indigo-500)'}),
                multiValueLabel: base => ({ ...base, color: 'white'}),
                multiValueRemove: base => ({ ...base, color: 'white', '&:hover': { backgroundColor: 'var(--indigo-700)', color: 'white'}})
            }}
          />
          </div>
          {errors.categoryIds && <p className="mt-1 text-xs text-red-600">{errors.categoryIds.join(', ')}</p>}
      </div>

      
      {/* Bölüm 5: Proje Katılımcıları */}
      <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
        <h2 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">Proje Katılımcıları ve Rolleri</h2>
        {errors.assignments && <p className="mt-2 text-sm text-red-600">{errors.assignments.join(', ')}</p>}
        <div className="mt-4 mb-6 space-y-2">
          {currentAssignments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Henüz bu projeye atanmış kimse yok.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
              {currentAssignments.map((assignment) => (
                <li key={`${assignment.artistId}-${assignment.role}`} className="px-4 py-3 flex items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{assignment.artistName || `Sanatçı ID: ${assignment.artistId}`}</span>
                    <span className="ml-2 px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                      {/* RoleInProject enum değerlerini daha okunabilir hale getirebiliriz */}
                      {availableRoles.find(r => r === assignment.role)?.replace('_', ' ') || assignment.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAssignment(assignment.artistId, assignment.role)}
                    className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                    disabled={isPending}
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-3 pt-4 border-t border-gray-300 dark:border-gray-600">
          <div className='flex-grow'>
            <label htmlFor='select-artist-to-add' className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sanatçı Seç</label>
            <Select
              instanceId="select-artist-to-add-project" // Benzersiz instanceId
              inputId='select-artist-to-add'
              options={artistOptions}
              value={selectedArtistToAdd}
              onChange={(option) => setSelectedArtistToAdd(option)}
              placeholder="Sanatçı ara veya seç..."
              isClearable
              isDisabled={isPending}
              className="react-select-container text-sm"
              classNamePrefix="react-select"
              styles={{ // Basit dark mode stilleri (globals.css'te CSS değişkenleri tanımlı olmalı)
                control: (base, state) => ({ ...base, backgroundColor: 'var(--input-bg-dark, #1f2937)', borderColor: state.isFocused ? 'var(--indigo-500, #6366f1)' : 'var(--border-dark, #4b5563)', '&:hover': { borderColor: 'var(--border-dark-hover, #6b7280)'}, boxShadow: state.isFocused ? '0 0 0 1px var(--indigo-500, #6366f1)' : 'none', minHeight: '38px' }),
                menu: base => ({ ...base, backgroundColor: 'var(--menu-bg-dark, #1f2937)', zIndex: 20 }), // z-index menünün üstte kalması için
                option: (base, { isFocused, isSelected }) => ({ ...base, backgroundColor: isSelected ? 'var(--indigo-600, #4f46e5)' : isFocused ? 'var(--menu-item-hover-bg-dark, #374151)' : 'var(--menu-bg-dark, #1f2937)', color: isSelected ? 'white' : 'var(--text-light, #f3f4f6)', '&:active': { backgroundColor: 'var(--indigo-700, #4338ca)'} }),
                multiValue: base => ({ ...base, backgroundColor: 'var(--indigo-500, #6366f1)'}),
                multiValueLabel: base => ({ ...base, color: 'white'}),
                multiValueRemove: base => ({ ...base, color: 'white', '&:hover': { backgroundColor: 'var(--indigo-700, #4338ca)', color: 'white'}}),
                placeholder: base => ({ ...base, color: 'var(--text-placeholder-dark, #9ca3af)'}),
                singleValue: base => ({ ...base, color: 'var(--text-light, #f3f4f6)'}),
                input: base => ({ ...base, color: 'var(--text-light, #f3f4f6)'}),
              }}
            />
          </div>
          <div className='w-full sm:w-auto sm:min-w-[150px]'>
            <label htmlFor="select-role-to-add" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol Seç</label>
            <select
              id="select-role-to-add"
              value={selectedRoleToAdd}
              onChange={(e) => setSelectedRoleToAdd(e.target.value as RoleInProject)}
              disabled={isPending}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 h-[38px]" // h-[38px] react-select ile aynı yükseklik için
            >
              <option value="" disabled>Rol seçin...</option>
              {availableRoles.map(role => (
                  <option key={role} value={role}>{role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option> // Daha okunabilir rol isimleri
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={addAssignment}
            disabled={!selectedArtistToAdd || !selectedRoleToAdd || isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 h-[38px] whitespace-nowrap sm:w-auto w-full"
          >
            Ata
          </button>
        </div>
      </div>

      {/* Yayınlama Durumu */}
      {/* Bölüm 6: Yayınlama Durumu */}
      <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
        <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">Yayın Ayarları</h2>
         <div className="mt-4 relative flex gap-x-3">
            <input
                id="isPublished"
                name="isPublished"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-600 dark:bg-gray-700 dark:ring-offset-gray-800"
            />
            </div>
            <div className="text-sm leading-6">
            <label htmlFor="isPublished" className="font-medium text-gray-900 dark:text-gray-100">
                Yayında
            </label>
            <p className="text-gray-500 dark:text-gray-400">Proje sitede herkes tarafından görülebilir mi?</p>
            </div>
        {errors.isPublished && <p className="mt-1 text-xs text-red-500">{typeof errors.isPublished === 'string' ? errors.isPublished : errors.isPublished.join(', ')}</p>}
      </div>

      {/* Kaydet Butonu */}
      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-md">
          İptal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
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
    </form>
  );
}