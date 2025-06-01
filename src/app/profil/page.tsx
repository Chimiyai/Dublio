// src/app/profil/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma'; 
import UserProfileForm, { UserProfileFormProps } from '@/components/profile/UserProfileForm'; // UserProfileFormProps'u import et
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profilim | PrestiJ Dublaj',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect('/giris?callbackUrl=/profil');
  }

  const userIdAsNumber = parseInt(session.user.id, 10); 
  if (isNaN(userIdAsNumber)) {
       redirect('/'); 
  }

  const userFromDb = await prisma.user.findUnique({
    where: { id: userIdAsNumber },
    select: { // Sadece UserProfileForm'un ihtiyaç duyduğu alanlar
      id: true,
      username: true,
      email: true,
      bio: true,
      role: true,
      profileImagePublicId: true,
      bannerImagePublicId: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  if (!userFromDb) {
    console.error(`Profil sayfası: Kullanıcı bulunamadı (ID: ${userIdAsNumber}).`);
    redirect('/'); 
  }

  // user objesini Client Component'e prop olarak geç
  // UserProfileForm'un beklediği tipe uygun olduğundan emin ol
  const userForForm: UserProfileFormProps['user'] = {
    id: userFromDb.id, // Prisma'dan number geliyor
    username: userFromDb.username,
    email: userFromDb.email,
    bio: userFromDb.bio, // Artık bu alan var
    role: userFromDb.role,
    profileImagePublicId: userFromDb.profileImagePublicId,
    bannerImagePublicId: userFromDb.bannerImagePublicId,
    createdAt: userFromDb.createdAt, // Bunlar Date objesi olarak gelmeli
    updatedAt: userFromDb.updatedAt, // Bunlar Date objesi olarak gelmeli
  };

  return <UserProfileForm user={userForForm} />;
}