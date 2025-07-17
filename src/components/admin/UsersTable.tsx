// src/components/admin/UsersTable.tsx

'use client';

import { useState } from 'react';
import { type UserWithCounts } from '@/app/admin/kullanicilar/page';
import Link from 'next/link';

interface Props {
  users: UserWithCounts[];
}

export default function UsersTable({ users }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <input 
                type="text"
                placeholder="Kullanıcı adı veya email ile ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ marginBottom: '20px', padding: '8px', width: '100%' }}
            />

            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Kullanıcı Adı</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Ekip Üyelikleri</th>
                        <th>Durum</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #333' }}>
                            <td style={{ padding: '10px' }}>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user._count.teamMemberships}</td>
                            <td>{user.isBanned ? 'Yasaklı' : 'Aktif'}</td>
                            <td>
                                <Link href={`/admin/kullanicilar/duzenle/${user.id}`} style={{ color: 'lightblue' }}>
                                    Düzenle
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}