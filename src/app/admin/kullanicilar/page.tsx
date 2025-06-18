// src/app/admin/kullanicilar/page.tsx
import prisma from '@/lib/prisma';
// Link artık kullanılmıyorsa kaldırılabilir, eğer başka yerde gerekmiyorsa.
// import Link from 'next/link';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import DeleteUserButton from '@/components/admin/DeleteUserButton';
import UpdateUserRole from '@/components/admin/UpdateUserRole'; // YENİ IMPORT
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import BanUserButton from '@/components/admin/BanUserButton';
import { cn } from '@/lib/utils';

export const revalidate = 0;

// 1. Kullanıcı objesinin tipini burada tanımlayalım
// Prisma'dan gelen verilere ve kullanımlara göre:
interface PageUser {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
  isBanned: boolean; // YENİ ALANI EKLE
  banExpiresAt: Date | null; // YENİ ALANI EKLE
}

async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const currentAdminId = session?.user?.id;

  const users: PageUser[] = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      isBanned: true, // YENİ ALANI SEÇ
      banExpiresAt: true, // YENİ ALANI SEÇ
    }
  });


  return (
  <div className="container mx-auto px-4 py-8">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-white">Kullanıcı Yönetimi</h1>
    </div>

      {users.length === 0 ? (
      <p className="text-gray-400">Gösterilecek kullanıcı bulunamadı.</p>
    ) : (
      <div className="overflow-x-auto bg-gray-900 shadow-xl rounded-lg border border-gray-800">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
               <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Kullanıcı Adı</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">E-posta</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Kayıt Tarihi</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">İşlemler</th>
            </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
            {/* 2. user parametresine tanımladığımız PageUser tipini atayalım */}
            {users.map((user: PageUser) => (
              <tr key={user.id} className={cn(
                  "hover:bg-gray-800/50 transition-colors",
                  user.isBanned && "bg-red-900/30 hover:bg-red-900/40" // Banlı ise satırı kırmızı yap
              )}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{user.username}
                {user.isBanned && <span className="ml-2 text-xs text-red-400">(Banlı)</span>}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-green-900 text-green-200'
                      : 'bg-blue-900 text-blue-200'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                  {format(new Date(user.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {/* Tüm butonları tek bir hücreye alalım */}
                  <div className="flex items-center space-x-4">
                    <UpdateUserRole
                      userId={user.id}
                      currentRole={user.role as 'user' | 'admin'}
                      username={user.username}
                      isCurrentUserAdmin={currentAdminId === user.id.toString()}
                    />
                    <DeleteUserButton
                      userId={user.id}
                      username={user.username}
                      isCurrentUserAdmin={currentAdminId === user.id.toString()}
                    />
                    {/* YENİ BAN BUTONU */}
                    <BanUserButton
                      userId={user.id}
                      username={user.username}
                      isBanned={user.isBanned}
                      isCurrentUserAdmin={currentAdminId === user.id.toString()}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
  );
}

export default AdminUsersPage;