import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import ProfileManagementContent from '@/components/profile/ProfileManagementContent'; // Yeni oluşturacağımız istemci bileşeni
import { Skill } from '@prisma/client';
import { DemoCategory, Content } from '@prisma/client';

// Bu sayfa sadece giriş yapmış kullanıcılar için.
// Bu yüzden bir veri çekme fonksiyonu yerine doğrudan ana bileşende yapacağız.
async function getDemoFormData() {
  const categories = await prisma.demoCategory.findMany();
  const contents = await prisma.content.findMany({ select: { id: true, title: true }});
  return { categories, contents };
}

async function getAllSkills(): Promise<Skill[]> {
  return prisma.skill.findMany({
    orderBy: { name: 'asc' }
  });
}

// Veri yapımızı tanımlayalım
const userForManagementQuery = {
  include: {
    skills: {
      include: {
        skill: true // <-- BU SATIR ÇOK ÖNEMLİ
      }
    },
    demos: {
      orderBy: { createdAt: 'desc' } as const
    }
  }
};
export type UserForManagement = Prisma.UserGetPayload<typeof userForManagementQuery>;


export default async function ProfileManagementPage() {
  const session = await getServerSession(authOptions);
  const allSkills = await getAllSkills();
  const { categories, contents } = await getDemoFormData();

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
    <ProfileManagementContent 
      user={user} 
      allSkills={allSkills}
      demoCategories={categories} // <-- YENİ
      allContents={contents}      // <-- YENİ
    />
  );
}
