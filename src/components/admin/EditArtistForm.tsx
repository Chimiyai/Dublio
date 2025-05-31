// src/components/admin/EditArtistForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, FormEvent, useEffect } from 'react';
import ImageUploader from '@/components/admin/ImageUploader';
import toast from 'react-hot-toast';
// import { DubbingArtist } from '@prisma/client'; // Prisma tipini doğrudan kullanmak yerine kendi form tipimizi tanımlayalım
import slugify from 'slugify'; // YENİ: slugify importu

// Düzenleme formu için prop tipi (page.tsx'ten gelecek)
// Bu tip, Prisma'daki DubbingArtist modeline eklediğimiz tüm alanları içermeli.
export interface ArtistFormDataForEdit {
  id: number; // Düzenleme için her zaman ID olmalı
  firstName: string;
  lastName: string;
  slug: string | null; // Prisma'da String? olduğu için null olabilir
  bio: string | null;
  imagePublicId: string | null;
  siteRole: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  donationLink: string | null;
  isTeamMember: boolean; // Prisma'da Boolean @default(false)
  teamOrder: number | null; // Prisma'da Int?
}

interface FormErrors {
  firstName?: string[];
  lastName?: string[];
  slug?: string[];
  imagePublicId?: string[]; // Bu alanı eklemiştik
  general?: string;
  // ... diğer olası hata alanları
}

interface EditArtistFormProps {
  artist?: ArtistFormDataForEdit; // Düzenleme için (initialArtistData bu tipte olmalı)
  isEditing: boolean;
}

// ... (ArtistApiPayload tipi aynı kalabilir, tüm alanlar opsiyonel olmalı)
interface ArtistApiPayload {
  firstName?: string;
  lastName?: string;
  slug?: string | null; // API'ye null gidebilir
  bio?: string | null;
  imagePublicId?: string | null;
  siteRole?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  donationLink?: string | null;
  isTeamMember?: boolean;
  teamOrder?: number | null;
}


export default function EditArtistForm({ artist: initialArtistData, isEditing }: EditArtistFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<any>({}); // Daha spesifik bir tip tanımlanabilir

  // Form state'leri (initialArtistData'dan DİKKATLİCE doldurulacak)
  const [firstName, setFirstName] = useState(initialArtistData?.firstName || '');
  const [lastName, setLastName] = useState(initialArtistData?.lastName || '');
  const [slug, setSlug] = useState(initialArtistData?.slug || ''); // initialArtistData.slug null olabilir, || '' ile boş string olur
  const [bio, setBio] = useState(initialArtistData?.bio || ''); // Aynı şekilde
  const [currentImagePublicId, setCurrentImagePublicId] = useState(initialArtistData?.imagePublicId || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [siteRole, setSiteRole] = useState(initialArtistData?.siteRole || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialArtistData?.websiteUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(initialArtistData?.twitterUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(initialArtistData?.instagramUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(initialArtistData?.youtubeUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialArtistData?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(initialArtistData?.githubUrl || '');
  const [donationLink, setDonationLink] = useState(initialArtistData?.donationLink || '');
  const [isTeamMember, setIsTeamMember] = useState(initialArtistData?.isTeamMember || false); // Varsayılan false
  const [teamOrder, setTeamOrder] = useState(initialArtistData?.teamOrder?.toString() || ''); // Sayıyı string'e çevir


  // İsim veya soyisim değiştikçe slug'ı otomatik güncelle
  useEffect(() => {
    // Sadece yeni sanatçı oluşturulmuyorsa VE (slug hiç girilmemişse VEYA mevcut slug eski isimle eşleşiyorsa)
    // Bu mantık, kullanıcının manuel girdiği slug'ı korumaya çalışır.
    if (isEditing) {
        if (!slug || (initialArtistData?.slug && slugify(`${initialArtistData.firstName} ${initialArtistData.lastName}`, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }) === initialArtistData.slug)) {
            if (firstName || lastName) {
                setSlug(slugify(`${firstName} ${lastName}`, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }));
            } else {
                setSlug('');
            }
        }
    } else { // Yeni sanatçı ekleme durumu
        if (firstName || lastName) {
            setSlug(slugify(`${firstName} ${lastName}`, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }));
        } else {
            setSlug('');
        }
    }
  }, [firstName, lastName, isEditing, initialArtistData]); // slug'ı bağımlılıktan çıkardık


  // initialArtistData değiştiğinde formu güncelle (router.refresh sonrası için)
  useEffect(() => {
    if (isEditing && initialArtistData) {
        setFirstName(initialArtistData.firstName || '');
        setLastName(initialArtistData.lastName || '');
        setSlug(initialArtistData.slug || ''); // initialArtistData.slug null olabilir
        setBio(initialArtistData.bio || '');   // initialArtistData.bio null olabilir
        setCurrentImagePublicId(initialArtistData.imagePublicId || null);
        setSiteRole(initialArtistData.siteRole || '');
        setWebsiteUrl(initialArtistData.websiteUrl || '');
        setTwitterUrl(initialArtistData.twitterUrl || '');
        setInstagramUrl(initialArtistData.instagramUrl || '');
        setYoutubeUrl(initialArtistData.youtubeUrl || '');
        setLinkedinUrl(initialArtistData.linkedinUrl || '');
        setGithubUrl(initialArtistData.githubUrl || '');
        setDonationLink(initialArtistData.donationLink || '');
        setIsTeamMember(initialArtistData.isTeamMember || false);
        setTeamOrder(initialArtistData.teamOrder?.toString() || '');
        setSelectedFile(null);
    }
  }, [initialArtistData, isEditing]);

  const handleImageUpload = async (file: File, context: string, identifier: string): Promise<string | null> => { // Parametreler eklendi
    const formData = new FormData();
    formData.append('imageFile', file);
    formData.append('uploadContext', context); // 'artistProfile' gibi
    formData.append('identifier', identifier); // sanatçı ID'si veya slug
    formData.append('folder', 'artist_profiles'); // Örnek folder

    const toastId = toast.loading('Profil resmi yükleniyor...');
    try {
      const uploadResponse = await fetch('/api/image-upload', { // Genel resim yükleme endpoint'i
          method: 'POST', 
          body: formData 
      });
      const uploadData = await uploadResponse.json();
      toast.dismiss(toastId);

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || `Profil resmi yüklenemedi.`);
      }
      toast.success(`Profil resmi başarıyla yüklendi.`);
      return uploadData.publicId;
    } catch (uploadError: any) {
      toast.dismiss(toastId);
      toast.error(uploadError.message);
      setErrors((prev: FormErrors) => ({ ...prev, imagePublicId: [uploadError.message] })); // TİP EKLENDİ
      return null;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({}); // Başlangıçta hataları temizle
    if (!firstName.trim() || !lastName.trim()) { 
        toast.error("İsim ve soyisim alanları zorunludur.");
        setErrors((prev: FormErrors) => ({ // TİP EKLENDİ
            ...prev,
            firstName: !firstName.trim() ? ["İsim zorunludur."] : undefined,
            lastName: !lastName.trim() ? ["Soyisim zorunludur."] : undefined,
        }));
        return; 
    }

    const loadingToastId = toast.loading('Sanatçı bilgileri kaydediliyor...');
    startTransition(async () => {
      let finalImagePublicId = currentImagePublicId;
      if (selectedFile) {
        const identifier = initialArtistData?.id?.toString() || slug || `${firstName}-${lastName}`;
        const uploadedId = await handleImageUpload(selectedFile, 'artistProfile', identifier); // Parametreler eklendi
        if (!uploadedId) { toast.dismiss(loadingToastId); return; }
        finalImagePublicId = uploadedId;
      }

      const payload: ArtistApiPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        slug: slug.trim() === '' ? null : slug.trim(), // Boşsa null gönder
        bio: bio.trim() === '' ? null : bio.trim(),
        imagePublicId: finalImagePublicId,
        siteRole: siteRole.trim() === '' ? null : siteRole.trim(),
        websiteUrl: websiteUrl.trim() === '' ? null : websiteUrl.trim(),
        twitterUrl: twitterUrl.trim() === '' ? null : twitterUrl.trim(),
        instagramUrl: instagramUrl.trim() === '' ? null : instagramUrl.trim(),
        youtubeUrl: youtubeUrl.trim() === '' ? null : youtubeUrl.trim(),
        linkedinUrl: linkedinUrl.trim() === '' ? null : linkedinUrl.trim(),
        githubUrl: githubUrl.trim() === '' ? null : githubUrl.trim(),
        donationLink: donationLink.trim() === '' ? null : donationLink.trim(),
        isTeamMember,
        teamOrder: teamOrder.trim() === '' ? null : parseInt(teamOrder, 10),
      };
      
      if (!isEditing || !initialArtistData?.id) {
          toast.dismiss(loadingToastId);
          toast.error("Sanatçı ID'si bulunamadı, düzenleme yapılamıyor.");
          return;
      }
      const apiUrl = `/api/admin/sanatcilar/${initialArtistData.id}`;

      try {
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        toast.dismiss(loadingToastId);

        if (!response.ok) {
          toast.dismiss(loadingToastId); 
          if (data.errors) {
            setErrors(data.errors);
            toast.error("Lütfen formdaki hataları düzeltin.");
          } else {
            const errorMessage = data.message || 'Sanatçı güncellenirken bir hata oluştu.';
            toast.error(errorMessage);
            setErrors({ general: errorMessage });
          }
          return;
        }

        toast.success('Sanatçı bilgileri başarıyla güncellendi.');
        setSelectedFile(null); // Dosya seçimini sıfırla
        if (data.slug && data.slug !== initialArtistData?.slug) {
            router.push(`/admin/sanatcilar/duzenle/${data.slug}`); // Slug değiştiyse yeni slug'a yönlendir
        } else {
            router.refresh(); // Sayfayı yenile
        }
      } catch (err: any) { 
        toast.dismiss(loadingToastId); 
        const errorMessage = err.message || 'Bir ağ hatası oluştu.';
        toast.error(errorMessage);
        setErrors({ general: errorMessage });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl">
      {/* Temel Bilgiler Bölümü */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Temel Bilgiler</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* İsim, Soyisim, Slug inputları */}
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          İsim <span className="text-red-500">*</span>
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
        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.join(', ')}</p>}
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Soyisim <span className="text-red-500">*</span>
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
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
            <input type="text" name="slug" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 ..."/>
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
          </div>
        </div>
        <div className="mt-6">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Biyografi</label>
          <textarea id="bio" name="bio" rows={4} value={bio || ''} onChange={(e) => setBio(e.target.value)} className="mt-1 ..."></textarea>
        </div>
      </section>

      {/* Resim Yükleme Bölümü */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profil Resmi</h2>
        <ImageUploader
            currentImagePublicId={currentImagePublicId}
            onFileSelect={(file) => {
                setSelectedFile(file);
                if (file) setCurrentImagePublicId(URL.createObjectURL(file));
                else setCurrentImagePublicId(initialArtistData?.imagePublicId || null);
            }}
            aspectRatio="aspect-square" // Kare profil resmi
            label="Profil Resmi Yükle / Değiştir"
            maxFileSizeMB={2}
        />
      </section>

      {/* Kadro Sayfası İçin Ek Bilgiler Bölümü */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Kadro Sayfası Bilgileri</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="siteRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sitedeki Unvanı (Opsiyonel)</label>
            <input type="text" name="siteRole" id="siteRole" value={siteRole || ''} onChange={(e) => setSiteRole(e.target.value)} className="mt-1 ..."/>
          </div>
          
          {/* Sosyal Medya Linkleri */}
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 pt-2">Sosyal Medya Linkleri</h3>
          {/* Örnek: Twitter */}
          <div>
            <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Twitter URL</label>
            <input type="url" name="twitterUrl" id="twitterUrl" value={twitterUrl || ''} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/kullaniciadi" className="mt-1 ..."/>
          </div>
          <div>
            <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instagram URL</label>
            <input type="url" name="instagramUrl" id="instagramUrl" value={instagramUrl || ''} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/kullaniciadi" className="mt-1 ..."/>
          </div>
          <div>
            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Youtube URL</label>
            <input type="url" name="youtubeUrl" id="youtubeUrl" value={youtubeUrl || ''} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/kullaniciadi" className="mt-1 ..."/>
          </div>
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website URL</label>
            <input type="url" name="websiteUrl" id="websiteUrl" value={websiteUrl || ''} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://ornek.com" className="mt-1 ..."/>
          </div>

          <div>
            <label htmlFor="donationLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bağış Linki (Opsiyonel)</label>
            <input type="url" name="donationLink" id="donationLink" value={donationLink || ''} onChange={(e) => setDonationLink(e.target.value)} placeholder="https://patreon.com/kullanici" className="mt-1 ..."/>
          </div>

          <div className="flex items-center gap-x-3">
            <input
              id="isTeamMember"
              name="isTeamMember"
              type="checkbox"
              checked={isTeamMember}
              onChange={(e) => setIsTeamMember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isTeamMember" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              "Kadromuz" sayfasında gösterilsin mi?
            </label>
          </div>

          {isTeamMember && ( // Sadece kadro üyesiyse sıralama göster
            <div>
              <label htmlFor="teamOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kadro Sıralaması (Opsiyonel, küçük sayı önce)</label>
              <input type="number" name="teamOrder" id="teamOrder" value={teamOrder} onChange={(e) => setTeamOrder(e.target.value)} className="mt-1 ..."/>
            </div>
          )}
        </div>
      </section>

      {/* Kaydet Butonu */}
      <div className="pt-8 flex justify-end">
        <button type="button" onClick={() => router.back()} className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3">
          İptal
        </button>
        <button type="submit" disabled={isPending} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </form>
  );
}