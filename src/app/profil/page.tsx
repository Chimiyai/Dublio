import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import ProfileManagementContent from '@/components/profile/ProfileManagementContent'; // Yeni oluşturacağımız istemci bileşeni

// Bu sayfa sadece giriş yapmış kullanıcılar için.
// Bu yüzden bir veri çekme fonksiyonu yerine doğrudan ana bileşende yapacağız.

// Veri yapımızı tanımlayalım
const userForManagementQuery = {
  include: {
    skills: true,
    demos: {
      orderBy: { createdAt: 'desc' } as const
    }
  }
};
export type UserForManagement = Prisma.UserGetPayload<typeof userForManagementQuery>;


export default async function ProfileManagementPage() {
  const session = await getServerSession(authOptions);

  // Eğer kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir.
  if (!session?.user?.id) {
    redirect('/giris');
  }

  // Oturumdaki kullanıcının en güncel verisini veritabanından çek.
  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id, 10) },
    ...userForManagementQuery
  });

  // Eğer bir sebepten ötürü kullanıcı veritabanında bulunamazsa (anormal bir durum)
  if (!user) {
    redirect('/giris');
  }

  // Veriyi istemci bileşenine aktar.
  return (
    <div>
      <h1>Profilimi Yönet</h1>
      <ProfileManagementContent user={user} />
    </div>
  );
}