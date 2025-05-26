// src/components/profile/UserProfileStatsBar.tsx (Yeni Dosya)
"use client";

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface UserProfileStatsBarProps {
  user: {
    createdAt: Date;
    updatedAt: Date;
  };
}

const UserProfileStatsBar: React.FC<UserProfileStatsBarProps> = ({ user }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-20 lg:pt-20 pb-6 md:pb-8"> {/* pt azaltıldı, profil aşağı kayınca */}
      <div className="flex flex-col sm:flex-row justify-end items-center mb-4">
        <div className="text-xs text-gray-400 text-center sm:text-right space-y-0.5">
          <div>
            <span>Son Profil Güncelleme: </span>
            <span className="text-gray-200 font-medium">{format(new Date(user.updatedAt), 'dd MMM yyyy, HH:mm:ss', { locale: tr })}</span>
          </div>
          <div>
            <span>Kayıt Tarihi: </span>
            <span className="text-gray-200 font-medium">{format(new Date(user.createdAt), 'dd MMM yyyy, HH:mm:ss', { locale: tr })}</span>
          </div>
        </div>
      </div>
      <hr className="border-t border-profile-hr-color" />
    </div>
  );
};

export default UserProfileStatsBar;