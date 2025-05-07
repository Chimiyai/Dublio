import prisma from '@/lib/prisma';
// Link artık kullanılmıyorsa kaldırılabilir, eğer başka yerde gerekmiyorsa.
// import Link from 'next/link'; 
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import DeleteUserButton from '@/components/admin/DeleteUserButton';
import UpdateUserRole from '@/components/admin/UpdateUserRole'; // YENİ IMPORT
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const revalidate = 0;

async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const currentAdminId = session?.user?.id; // string (NextAuth'tan)

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    // Şifre alanını çekmemek daha güvenli, zaten kullanmıyoruz.
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      // Not: Project, Message gibi ilişkili alanlar burada çekilmiyor, gerekirse eklenebilir.
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kullanıcı Yönetimi</h1>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-600">Gösterilecek kullanıcı bulunamadı.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Kullanıcı Adı</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">E-posta</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Kayıt Tarihi</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Rol Değiştir</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Sil</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(user.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <UpdateUserRole
                      userId={user.id} // number
                      currentRole={user.role as 'user' | 'admin'} // Prisma'dan gelen string, tipini belirtiyoruz
                      username={user.username}
                      isCurrentUserAdmin={currentAdminId === user.id.toString()} // Karşılaştırma
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <DeleteUserButton
                      userId={user.id} // number
                      username={user.username}
                      isCurrentUserAdmin={currentAdminId === user.id.toString()} // Karşılaştırma
                    />
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