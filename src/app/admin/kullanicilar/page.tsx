// src/app/admin/kullanicilar/page.tsx

import prisma from '@/lib/prisma';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import UsersTable from '@/components/admin/UsersTable';
import { Prisma } from '@prisma/client';

// Kullanıcıları çekerken, kaç ekibe üye olduklarını da alalım
const usersQuery = {
    orderBy: {
        createdAt: 'desc'
    },
    include: {
        _count: {
            select: { teamMemberships: true }
        }
    }
} as const;

export type UserWithCounts = Prisma.UserGetPayload<typeof usersQuery>;

async function getUsers() {
    return prisma.user.findMany(usersQuery);
}

export default async function AdminUsersPage() {
    const users = await getUsers();

    return (
        <AdminPageLayout pageTitle="Kullanıcı Yönetimi">
            <p style={{ color: '#aaa', marginTop: '-10px', marginBottom: '20px' }}>
                Platformdaki tüm kullanıcıları buradan yönetebilirsiniz.
            </p>
            <UsersTable users={users} />
        </AdminPageLayout>
    );
}