// src/app/kadromuz/page.tsx
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
// import { DubbingArtist } from '@prisma/client'; // Tam tipi değil, seçilen alanları kullanacağız
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { FaTwitter, FaInstagram, FaYoutube, FaGlobe, FaLinkedin, FaGithub } from 'react-icons/fa';
import { HeartIcon as DonationIconOutline } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Kadromuz | PrestiJ Studio',
  description: 'PrestiJ Studio ekibiyle tanışın. Projelerimize hayat veren yetenekli seslendirme sanatçılarımız, çevirmenlerimiz ve tüm değerli üyelerimiz.',
};
export interface TeamMemberForPage { // Yeni tip adı
  id: number;
  firstName: string;
  lastName: string;
  slug: string | null;
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
  // isTeamMember ve teamOrder'ı select etmiştik, ama render sırasında direkt kullanmıyorduk.
  // Eğer sıralama dışında kullanılmayacaksa bu tipe eklemeyebiliriz.
  // Ama orderBy'da kullandığımız için ve ileride gerekebileceği için ekleyebiliriz.
  isTeamMember: boolean; // isTeamMember'ı da ekleyelim, belki UI'da bir kontrol için lazım olur
  teamOrder: number | null;
}

// Sosyal medya platformları için ikon ve renk eşleştirmesi (önceki gibi)
interface SocialMediaPlatform {
  // keyof TeamMemberForPage yerine spesifik sosyal medya alanlarını kullanalım
  key: 'websiteUrl' | 'twitterUrl' | 'instagramUrl' | 'youtubeUrl' | 'linkedinUrl' | 'githubUrl';
  icon: React.ElementType;
  hoverColor: string;
  title: string;
}

const socialPlatforms: SocialMediaPlatform[] = [
  { key: 'websiteUrl', icon: FaGlobe, hoverColor: 'hover:text-green-500', title: 'Website' },
  { key: 'twitterUrl', icon: FaTwitter, hoverColor: 'hover:text-blue-400', title: 'Twitter' },
  { key: 'instagramUrl', icon: FaInstagram, hoverColor: 'hover:text-pink-500', title: 'Instagram' },
  { key: 'youtubeUrl', icon: FaYoutube, hoverColor: 'hover:text-red-500', title: 'YouTube' },
  { key: 'linkedinUrl', icon: FaLinkedin, hoverColor: 'hover:text-blue-600', title: 'LinkedIn' },
  { key: 'githubUrl', icon: FaGithub, hoverColor: 'hover:text-gray-400', title: 'GitHub' },
];

// Veritabanından ekip üyelerini çeken fonksiyon
async function getTeamMembers(): Promise<TeamMemberForPage[]> { // Dönüş tipi güncellendi
  const membersData = await prisma.dubbingArtist.findMany({
    where: {
      isTeamMember: true,
    },
    orderBy: [
      { teamOrder: 'asc' },
      { firstName: 'asc' },
      { lastName: 'asc' },
    ],
    select: { // Bu select, TeamMemberForPage tipiyle eşleşmeli
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
        isTeamMember: true, // Select'e eklendi
        teamOrder: true,    // Select'e eklendi
    }
  });
  return membersData as TeamMemberForPage[]; // Tip güvencesi için cast edebiliriz.
                                          // Veya membersData'yı map'leyerek yeni obje oluşturabiliriz.
                                          // En iyisi select'in tipi tam karşılamasıdır.
}

export default async function KadromuzPage() {
  const teamMembers: TeamMemberForPage[] = await getTeamMembers();

  return (
    <div className="bg-prestij-dark-900 text-prestij-text-primary min-h-screen py-16 md:py-20"> {/* Arka plan rengi güncellendi */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 md:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Ekibimizle Tanışın
          </h1>
          <p className="mt-5 text-lg leading-8 text-prestij-text-secondary max-w-2xl mx-auto">
            PrestiJ Studio'nun projelerine hayat veren, tutkulu ve deneyimli kadromuz.
          </p>
        </div>

        {teamMembers.length === 0 ? (
          <p className="text-center text-xl text-prestij-text-secondary py-10">
            Kadromuz şu anda güncelleniyor. Yakında burada olacak!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {teamMembers.map((member) => {
              // member objesi artık DubbingArtist tipinde (seçilen alanlarla)
              const memberProfileLink = `/sanatcilar/${member.id}`;
              const avatarUrl = getCloudinaryImageUrlOptimized(
                member.imagePublicId,
                { width: 128, height: 128, crop: 'fill', gravity: 'face', quality: 'auto' },
                'avatar' // public/images/default-avatar.png gibi bir placeholder yolu olmalı
              );

              // Aktif sosyal linkleri filtrele
              const activeSocialLinks = socialPlatforms.filter(platform => {
                const linkValue = member[platform.key]; // member artık TeamMemberForPage tipinde
                return typeof linkValue === 'string' && linkValue.trim() !== '';
              });

              return (
                <div 
                  key={member.id} 
                  className="group flex flex-col bg-prestij-card-bg p-6 rounded-xl shadow-xl hover:shadow-prestij-500/30 transition-all duration-300 ease-out hover:-translate-y-1 border border-transparent hover:border-prestij-500/50"
                >
                  {/* Avatar ve İsim için Link (Bu zaten vardı) */}
                  <Link href={memberProfileLink} className="flex flex-col items-center text-center mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden mb-5 border-2 border-prestij-dark-700 group-hover:border-prestij-500 transition-all duration-300 transform group-hover:scale-105 relative bg-prestij-dark-700">
                      <Image
                        src={avatarUrl || '/images/default-avatar.png'}
                        alt={`${member.firstName} ${member.lastName}`}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-prestij-400 transition-colors duration-300">
                      {member.firstName} {member.lastName}
                    </h3>
                    {member.siteRole && (
                      <p className="text-xs sm:text-sm font-medium mt-1 text-prestij-role-text group-hover:text-sky-200 transition-colors">
                        {member.siteRole}
                      </p>
                    )}
                  </Link>

                  {member.bio && (
                    <p className="text-sm text-prestij-text-secondary leading-relaxed text-center flex-grow mb-5">
                      {member.bio}
                    </p>
                  )}

                  {activeSocialLinks.length > 0 && (
                    <div className="mb-5 pt-4 border-t border-prestij-dark-700/50 flex flex-wrap justify-center items-center gap-4">
                      {activeSocialLinks.map((platform) => {
                        const IconComponent = platform.icon;
                        const link = member[platform.key] as string; // Artık null olmamalı (filter sayesinde)
                        // if (link) { // Bu if'e gerek kalmayabilir filter sayesinde
                          return (
                            <Link key={platform.key} href={link} target="_blank" rel="noopener noreferrer" 
                                  className={`text-prestij-text-muted transition-colors duration-200 ${platform.hoverColor}`} 
                                  title={platform.title}>
                              <IconComponent size={22} />
                            </Link>
                          );
                        // }
                        // return null;
                    })}
                    </div>
                  )}
                  
                  {member.donationLink && (
                    <div className="mt-auto pt-4">
                      <Link
                        href={member.donationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-prestij-500/10 hover:bg-prestij-500/20 text-prestij-300 hover:text-prestij-200 border border-prestij-500/30 hover:border-prestij-500/50 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 group-hover:bg-prestij-500 group-hover:text-white group-hover:border-prestij-500"
                      >
                        <DonationIconOutline className="w-5 h-5 mr-2" />
                        Destek Ol
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}