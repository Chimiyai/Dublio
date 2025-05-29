// src/app/profil/[username]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Image from 'next/image'; // ActivityContent veya diğerleri kullanabilir diye ekliyoruz
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Auth options dosyanızın yolu

import UserProfileBanner from '@/components/profile/UserProfileBanner';
import UserProfileInfo from '@/components/profile/UserProfileInfo';
import UserProfileStatsBar from '@/components/profile/UserProfileStatsBar';
import UserProfileTabs, { ProfileTabKey } from '@/components/profile/UserProfileTabs';
import OverviewContent from '@/components/profile/OverviewContent';
import ActivityContent, { UserCommentActivity } from '@/components/profile/ActivityContent'; // UserCommentActivity tipini de import et
import LibraryContent from '@/components/profile/LibraryContent';

interface UserProfilePageProps {
  params: { username: string };
  searchParams: { tab?: string };
}

async function getUserProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username: decodeURIComponent(username) },
    select: {
      id: true,
      username: true,
      bio: true,
      profileImagePublicId: true,
      bannerImagePublicId: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },
  });
  return user;
}

async function getUserComments(userId: number, limit = 21): Promise<UserCommentActivity[]> {
  try {
    const comments = await prisma.comment.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        project: { 
          select: { 
            title: true, 
            slug: true, 
            type: true, 
            coverImagePublicId: true 
            // bannerImagePublicId ActivityContent'te proje resmi için kullanılmıyorsa kaldırılabilir
          }
        },
        user: { // Yorumu yapan kullanıcı (bu durumda hep aynı kullanıcı olacak)
          select: { 
            id: true, 
            username: true, 
            profileImagePublicId: true 
          }
        }
      }
    });

    return comments.map(comment => ({
      type: 'comment' as const,
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt, // Date objesi olarak kalabilir, client'ta formatlanır
      project: {
        title: comment.project.title,
        slug: comment.project.slug,
        type: comment.project.type,
        coverImagePublicId: comment.project.coverImagePublicId || null,
        bannerImagePublicId: null, // ActivityContent için banner yerine cover kullanıyoruz
      },
      user: { // Yorumu yapan kullanıcı (kendisi)
        id: comment.user.id, // Aslında bu userId ile aynı olacak
        username: comment.user.username,
        profileImagePublicId: comment.user.profileImagePublicId || null,
      }
    }));
  } catch (error) {
    console.error("Error fetching user comments for profile page:", error);
    return [];
  }
}

export default async function UserProfilePage({ params, searchParams }: UserProfilePageProps) {
  const session = await getServerSession(authOptions);
  
  const currentUsernameFromParams = params.username;
  const activeTabFromSearchParams = searchParams?.tab;

  const user = await getUserProfile(currentUsernameFromParams);

  if (!user) {
    notFound();
  }

  const loggedInUserId = session?.user?.id;
  const loggedInUserRole = session?.user?.role;
  
  let isOwnProfile = false;
  if (loggedInUserId !== undefined && loggedInUserId !== null) {
    isOwnProfile = loggedInUserId.toString() === user.id.toString();
  }
  // Admin her profili "kendi profiliymiş gibi" düzenleme yetkisine sahip olsun mu?
  // Eğer öyleyse:
  const canAdminEdit = loggedInUserRole === 'admin';
  const displayEditButton = isOwnProfile || canAdminEdit; // Düzenle butonu için

  const finalBannerUrl = getCloudinaryImageUrlOptimized(
    user.bannerImagePublicId,
    { width: 1920, height: 1080, crop: 'fill', gravity: 'auto', quality: 'auto', format: 'auto' },
    'banner'
  );
  
  const profileImageSizes = {
    base: { w: "w-32 sm:w-36 md:w-40 lg:w-44", h: "h-32 sm:h-36 md:h-40 lg:h-44" },
    backdrop: { w: "w-36 sm:w-40 md:w-44 lg:w-[194px]", h: "h-36 sm:h-40 md:h-44 lg:h-[194px]" }
  };

  const activeTab = (activeTabFromSearchParams || 'overview') as ProfileTabKey;

  let initialActivityComments: UserCommentActivity[] = [];
  if (activeTab === 'activity') {
    initialActivityComments = await getUserComments(user.id);
  }

  // OverviewContent için de benzer şekilde veri çekilebilir veya client component içinde fetch edilebilir
  // Şimdilik OverviewContent kendi içinde API isteği yapıyor.

  return (
    <div className="bg-profile-page-bg min-h-screen text-gray-200">
      <UserProfileBanner 
        bannerUrl={finalBannerUrl} 
        username={user.username}
        // Raporla butonu için: Kendi profili değilse VE giriş yapmışsa
        isOwnProfile={isOwnProfile} 
      />
      <div className="relative z-10 -mt-28 sm:-mt-32 md:-mt-36 lg:-mt-44">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <UserProfileInfo 
                user={{
                    username: user.username,
                    bio: user.bio,
                    profileImagePublicId: user.profileImagePublicId,
                }}
                isOwnProfile={isOwnProfile} // Mesaj gönder/düzenle butonu için
                // canEdit={displayEditButton} // Eğer UserProfileInfo'ya canEdit prop'u eklediyseniz
                profileImageSizes={profileImageSizes}
            />
        </div>
      </div>
      <UserProfileStatsBar user={{ createdAt: user.createdAt, updatedAt: user.updatedAt }} />

      <section className="profile-content container mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          <UserProfileTabs
            activeTab={activeTab}
            isOwnProfile={isOwnProfile || canAdminEdit} // Hesap Ayarları sekmesi için
            username={currentUsernameFromParams}
          />
          <main className="w-full md:w-3/4 lg:w-4/5">
            {activeTab === 'overview' && (
              <OverviewContent 
                user={{ id: user.id, username: user.username }} 
              />
            )}
            {activeTab === 'activity' && (
              <ActivityContent 
                initialComments={initialActivityComments} 
                userIdOfProfile={user.id} 
              />
            )}
            {activeTab === 'library' && <LibraryContent userId={user.id} />}
          </main>
        </div>
      </section>
    </div>
  );
}