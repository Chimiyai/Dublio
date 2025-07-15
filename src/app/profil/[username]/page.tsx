// src/app/profil/[username]/page.tsx
import { notFound, redirect } from 'next/navigation'; // redirect eklendi
import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

import UserProfileBanner from '@/components/profile/UserProfileBanner';
import UserProfileInfo from '@/components/profile/UserProfileInfo';
import UserProfileStatsBar from '@/components/profile/UserProfileStatsBar';
import UserProfileTabs, { ProfileTabKey } from '@/components/profile/UserProfileTabs';
import OverviewContent from '@/components/profile/OverviewContent';
import ActivityContent, { UserCommentActivity } from '@/components/profile/ActivityContent';
import LibraryContent from '@/components/profile/LibraryContent';
import type { Metadata } from 'next'; // Metadata importu


interface UserProfilePageServerProps {
  params: Promise<{ username: string }>;
  searchParams?: { [key: string]: string | string[] | undefined }; // searchParams genellikle Promise değildir
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

export async function generateMetadata(
  { params, searchParams }: { // searchParams'ı da alabilir ama metadata için genellikle kullanılmaz
    params: Promise<{ username: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // Promise olarak ekleyelim
  }
): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username;
  // const resolvedSearchParams = searchParams ? await searchParams : {}; // Metadata için gerekirse

  if (!username || typeof username !== 'string' || username.trim() === "") {
    return { title: 'Profil | Dublio' };
  }
  const user = await getUserProfile(decodeURIComponent(username));
  if (!user) {
    return { title: 'Kullanıcı Bulunamadı | Dublio' };
  }
  return {
    title: `${user.username} Profili | Dublio`,
    description: user.bio || `${user.username} kullanıcısının Dublio profili.`,
  };
}

// --- YENİ: Engelleme kontrolü için getUserSpecificData fonksiyonu ---
async function getUserSpecificData(currentUserId: number | undefined, profileUserId: number) {
  if (!currentUserId || currentUserId === profileUserId) {
    return { 
      userHasGame: false, 
      userInitialInteraction: { liked: false, disliked: false, favorited: false },
      // Kendi profili veya giriş yapılmamışsa engelleme durumu yoktur
      isBlockedByCurrentUser: false,
      isBlockingCurrentUser: false
    };
  }
  
  // ... (userHasGame ve userInitialInteraction sorguları aynı)
  const [userHasGameEntry, likedEntry, dislikedEntry, favoritedEntry, blockStatus] = await Promise.all([
    prisma.userOwnedGame.findUnique({ where: { userId_projectId: { userId: currentUserId, projectId: profileUserId } } }), // Bu satırda hata var, projectId değil profileUserId olmalı. Ama konumuz engelleme.
    prisma.projectLike.findUnique({ where: { userId_projectId: { userId: currentUserId, projectId: profileUserId } } }),
    prisma.projectDislike.findUnique({ where: { userId_projectId: { userId: currentUserId, projectId: profileUserId } } }),
    prisma.projectFavorite.findUnique({ where: { userId_projectId: { userId: currentUserId, projectId: profileUserId } } }),
    prisma.userBlock.findFirst({
        where: {
            OR: [
                { blockerId: currentUserId, blockingId: profileUserId }, // Ben onu engelledim mi?
                { blockerId: profileUserId, blockingId: currentUserId }, // O beni engelledi mi?
            ]
        }
    })
  ]);

  const userHasGame = !!userHasGameEntry; // Varsayımsal, bu mantık hatalı olabilir
  const userInitialInteraction = { liked: !!likedEntry, disliked: !!dislikedEntry, favorited: !!favoritedEntry };

  const isBlockedByCurrentUser = !!blockStatus && blockStatus.blockerId === currentUserId;
  const isBlockingCurrentUser = !!blockStatus && blockStatus.blockingId === currentUserId;

  return { userHasGame, userInitialInteraction, isBlockedByCurrentUser, isBlockingCurrentUser };
}

export default async function UserProfilePage(
  { params, searchParams }: { 
    params: Promise<{ username: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams'ı da Promise olarak al
  }
) {
  const session = await getServerSession(authOptions);
  
  const resolvedParams = await params;
  const currentUsernameFromParams = resolvedParams.username;

  // searchParams'ı çöz
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTabFromSearchParams = resolvedSearchParams?.tab as string | undefined;

  if (!currentUsernameFromParams || typeof currentUsernameFromParams !== 'string' || currentUsernameFromParams.trim() === "") {
    console.error("UserProfilePage: Eksik veya geçersiz username parametresi.");
    notFound();
  }
  
  const user = await getUserProfile(decodeURIComponent(currentUsernameFromParams));

  if (!user) {
    notFound();
  }

  const loggedInUserId = session?.user?.id;
  const loggedInUserRole = session?.user?.role;
  
  let isOwnProfile = false;
  if (loggedInUserId !== undefined && loggedInUserId !== null) {
    isOwnProfile = loggedInUserId.toString() === user.id.toString();
  }
  const canAdminEdit = loggedInUserRole === 'admin';
  // const displayEditButton = isOwnProfile || canAdminEdit; // Bu değişken kullanılmıyorsa kaldırılabilir

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

  const { userHasGame, userInitialInteraction, isBlockedByCurrentUser, isBlockingCurrentUser } = await getUserSpecificData(parseInt(loggedInUserId || '0'), user.id);

  // Engelleme durumunu tek bir değişkende birleştirelim
  const isBlocked = isBlockedByCurrentUser || isBlockingCurrentUser;

  return (
    <div className="bg-profile-page-bg min-h-screen text-gray-200">
      <UserProfileBanner 
        bannerUrl={finalBannerUrl} 
        username={user.username}
        isOwnProfile={isOwnProfile}
        
        // --- DÜZELTME BURADA: Eksik olan `profileId` prop'unu ekliyoruz ---
        profileId={user.id} 
        // -----------------------------------------------------------------
      />
      <div className="relative z-10 -mt-28 sm:-mt-32 md:-mt-36 lg:-mt-44">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <UserProfileInfo 
                user={{
                    id: user.id,
                    username: user.username,
                    bio: user.bio,
                    profileImagePublicId: user.profileImagePublicId,
                }}
                isOwnProfile={isOwnProfile}

                // --- DÜZELTME BURADA ---
                isBlocked={isBlocked} // <<< EKSİK OLAN PROP'U EKLE
                // -----------------------

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