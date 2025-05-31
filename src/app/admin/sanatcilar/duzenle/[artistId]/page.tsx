// src/app/admin/sanatcilar/duzenle/[artistId]/page.tsx
import prisma from '@/lib/prisma';
import EditArtistForm, { ArtistFormDataForEdit } from '@/components/admin/EditArtistForm';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next'; // Metadata'yı import et

interface EditSanatciPageProps {
  params: {
    artistId: string;
  };
}

export async function generateMetadata({ params }: EditSanatciPageProps): Promise<Metadata> { // Promise<Metadata> eklendi
  const artistIdAsNumber = parseInt(params.artistId, 10); // Değişken adı tutarlı olsun
  if (isNaN(artistIdAsNumber)) {
    return { title: 'Sanatçı Bulunamadı | Admin Paneli' };
  }
  const artist = await prisma.dubbingArtist.findUnique({
    where: { id: artistIdAsNumber },
    select: { firstName: true, lastName: true }, // Sadece metadata için gerekli alanlar
  });

  if (!artist) {
    return { title: 'Sanatçı Bulunamadı | Admin Paneli' };
  }
  return {
    title: `Düzenle: ${artist.firstName} ${artist.lastName} | Admin Paneli`,
  };
}

export default async function EditSanatciPage({ params }: EditSanatciPageProps) {
  const artistIdAsNumber = parseInt(params.artistId, 10);

  if (isNaN(artistIdAsNumber)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Geçersiz Sanatçı ID</h1>
        <p className="text-gray-600">Lütfen geçerli bir ID ile tekrar deneyin.</p>
        <Link href="/admin/sanatcilar" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
          Sanatçı Listesine Geri Dön
        </Link>
      </div>
    );
  }

  const artistFromDb = await prisma.dubbingArtist.findUnique({
    where: { id: artistIdAsNumber },
    // ArtistFormDataForEdit tipinin beklediği TÜM alanları seçmeliyiz
    select: {
      id: true,
      firstName: true,
      lastName: true,
      slug: true,
      bio: true,
      imagePublicId: true,
      siteRole: true,
      websiteUrl: true,
      twitterUrl: true,
      instagramUrl: true,
      youtubeUrl: true,
      linkedinUrl: true,
      githubUrl: true,
      donationLink: true,
      isTeamMember: true,
      teamOrder: true,
      // createdAt ve updatedAt ArtistFormDataForEdit'te yoksa seçmeye gerek yok
    }
  });

  if (!artistFromDb) {
    notFound();
  }

  // Prisma'dan gelen veriyi ArtistFormDataForEdit tipine uygun hale getir
  const artistForForm: ArtistFormDataForEdit = {
    id: artistFromDb.id,
    firstName: artistFromDb.firstName,
    lastName: artistFromDb.lastName,
    slug: artistFromDb.slug || null, // Prisma'dan null gelebilir
    bio: artistFromDb.bio || null,
    imagePublicId: artistFromDb.imagePublicId || null,
    siteRole: artistFromDb.siteRole || null,
    websiteUrl: artistFromDb.websiteUrl || null,
    twitterUrl: artistFromDb.twitterUrl || null,
    instagramUrl: artistFromDb.instagramUrl || null,
    youtubeUrl: artistFromDb.youtubeUrl || null,
    linkedinUrl: artistFromDb.linkedinUrl || null,
    githubUrl: artistFromDb.githubUrl || null,
    donationLink: artistFromDb.donationLink || null,
    isTeamMember: artistFromDb.isTeamMember || false, // Prisma'dan null gelmez ama tip boolean
    teamOrder: artistFromDb.teamOrder === null ? null : Number(artistFromDb.teamOrder), // Number veya null
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/sanatcilar" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Geri Dön (Sanatçı Listesi)
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
        Sanatçı Düzenle: <span className="text-indigo-600">{`${artistForForm.firstName} ${artistForForm.lastName}`}</span> {/* artistForForm kullanıldı */}
      </h1>
      <div className="max-w-2xl mx-auto">
        <EditArtistForm artist={artistForForm} isEditing={true} /> {/* isEditing prop'u eklendi */}
      </div>
    </div>
  );
}