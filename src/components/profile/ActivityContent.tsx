// src/components/profile/ActivityContent.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
// import { useEffect, useState } from 'react';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary';
import { UserCircleIcon } from '@heroicons/react/24/solid'; // Yorum yapan kullanıcı için placeholder
import { ChatBubbleLeftEllipsisIcon as CommentIcon } from '@heroicons/react/24/outline'; // Outline ikon daha kibar durabilir
import { format, formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface UserCommentActivity {
  type: 'comment';
  id: number;
  content: string;
  createdAt: string | Date;
  project: {
    title: string;
    slug: string;
    type: string;
    coverImagePublicId: string | null;
    bannerImagePublicId: string | null;
  };
  user: {
    id: number;
    username: string;
    profileImagePublicId: string | null;
  };
}

interface ActivityContentProps {
  initialComments: UserCommentActivity[];
  userIdOfProfile: number;
}

const ActivityContent: React.FC<ActivityContentProps> = ({ initialComments, userIdOfProfile }) => {
  const comments = initialComments;

  if (!comments) {
    return <p className="text-center text-red-400 py-10">Yorum verisi yüklenirken bir sorun oluştu.</p>;
  }
  if (comments.length === 0) {
    return <p className="text-gray-400 text-center py-10">Henüz yapılmış bir yorum bulunmuyor.</p>;
  }

  // Yeni Kart Tasarımı (Liste Öğesi Olarak)
  // Grid yerine dikey bir liste kullanalım, her yorum daha detaylı görünecek
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Yaptığı Yorumlar</h2>
        <span className="text-sm text-gray-400 mt-1 sm:mt-0">
          {comments.length} yorum bulundu
        </span>
      </div>

      {/* Yorum Listesi */}
      <div className="space-y-4">
        {comments.map((comment) => {
          const userProfileImageUrl = getCloudinaryImageUrlOptimized(
            comment.user.profileImagePublicId,
            { width: 40, height: 40, crop: 'thumb', gravity: 'face', radius: 'max' }, // Yuvarlak profil resmi
            'avatar'
          );
          const projectTypePath = comment.project.type.toLowerCase() === 'oyun' ? 'oyunlar' : 'animeler';
          const commentDate = new Date(comment.createdAt);
          const formattedFullDate = format(commentDate, 'dd MMMM yyyy, HH:mm', { locale: tr });

          return (
            <div 
              key={comment.id} 
              className="activity-comment-card bg-[#08060D] p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              // tailwind.config.js'de 'comment-card-bg': '#08060D' tanımlanabilir
            >
              <div className="flex items-start space-x-3">
                {/* Yorumu Yapanın Profil Resmi */}
                <Link href={`/profil/${comment.user.username}`} className="flex-shrink-0 mt-1">
                  {comment.user.profileImagePublicId ? (
                    <Image
                      src={userProfileImageUrl}
                      alt={comment.user.username}
                      width={36} // h-9 w-9
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-9 h-9 text-gray-500" />
                  )}
                </Link>

                {/* Yorum İçeriği */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-baseline space-x-2 mb-1">
                    <Link href={`/profil/${comment.user.username}`} className="font-semibold text-sm text-gray-100 hover:underline">
                      {comment.user.username}
                    </Link>
                    <span 
                        className="text-2xs text-gray-400"
                        title={formattedFullDate}
                    >
                      · {formatDistanceToNowStrict(commentDate, { addSuffix: true, locale: tr })}
                    </span>
                  </div>
                  {/* Yorum Metni (Karakter sınırı yok) */}
                  <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    <span className="italic">{comment.project.title}</span> adlı içeriğe yapılan yorum.
                    <Link href={`/${projectTypePath}/${comment.project.slug}#comment-${comment.id}`}
                          className="ml-2 text-purple-400 hover:text-purple-300 hover:underline">
                        Yoruma Git
                    </Link>
                  </p>
                </div>

                {/* Opsiyonel: Projenin Küçük Resmi (Sağda) - İsteğe Bağlı */}
                {/* <Link href={`/${projectTypePath}/${comment.project.slug}`} className="flex-shrink-0 ml-auto hidden sm:block">
                  <div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden">
                    {comment.project.coverImagePublicId ? (
                      <Image
                        src={getCloudinaryImageUrlOptimized(comment.project.coverImagePublicId, { width: 80, height: 80, crop: 'thumb'}, 'cover')}
                        alt={comment.project.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-600"></div>
                    )}
                  </div>
                </Link> */}
              </div>
            </div>
          );
        })}
      </div>
      {/* TODO: Daha Fazla Yükle / Sayfalama */}
    </div>
  );
};

export default ActivityContent;
