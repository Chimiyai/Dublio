// src/app/profil/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma'; 
import UserProfileForm from '@/components/profile/UserProfileForm'; // YENİ Client Component
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profilim | Prestij Dublaj',
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

  const user = await prisma.user.findUnique({
    where: { id: userIdAsNumber },
    select: { // Sadece UserProfileForm'un ihtiyaç duyduğu alanlar
      id: true,
      username: true,
      email: true,
      role: true,
      profileImagePublicId: true,
      bannerImagePublicId: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  if (!user) {
    redirect('/'); 
  }

  // user objesini Client Component'e prop olarak geç
  // UserProfileForm'un beklediği tipe uygun olduğundan emin ol
  const userForForm = {
    ...user,
    id: user.id, // id string veya number olabilir, UserProfileFormProps'a göre ayarla
                 // Prisma'dan number geliyor, session'dan string gelebilir. Tutarlı olmalı.
                 // Şimdilik Prisma'dan gelen number'ı kullanıyoruz.
  };

  return <UserProfileForm user={userForForm} />;
}