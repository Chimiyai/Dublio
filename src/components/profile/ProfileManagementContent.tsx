//src/components/profile/ProfileManagementContent.tsx
'use client';

import { useState } from 'react';
import { UserForManagement } from '@/app/profil/page'; // Tipleri import et
import UpdateProfileForm from './UpdateProfileForm';
import { UserSkill } from '@prisma/client';

// Gelecekte oluşturacağımız form bileşenleri için hazırlık
import ManageSkillsForm from './ManageSkillsForm';
// import ManageDemosForm from './ManageDemosForm';

interface Props {
  user: UserForManagement;
}

export default function ProfileManagementContent({ user: initialUser }: Props) {
  const [user, setUser] = useState(initialUser);

  const handleProfileUpdate = (updatedData: Partial<UserForManagement>) => {
    setUser(prevUser => ({ ...prevUser, ...updatedData }));
  };

  // Yetenekler güncellendiğinde çağrılacak yeni callback fonksiyonu
  const handleSkillsUpdate = (newSkills: UserSkill[]) => {
    setUser(prevUser => ({ ...prevUser, skills: newSkills }));
  };

  return (
    <div style={{ color: 'white', background: '#1c1c1c', padding: '20px', display: 'flex', gap: '40px' }}>
      
      {/* Sol Taraf: Mevcut Bilgiler (DEĞİŞİKLİK YOK) */}
      <div style={{ flex: 1 }}>
        <h2>Mevcut Bilgilerin</h2>
        <p><strong>Kullanıcı Adı:</strong> {user.username}</p>
        <p><strong>E-posta:</strong> {user.email}</p>
        <p><strong>Bio:</strong> {user.bio || 'Yok'}</p>
        
        <hr style={{ margin: '20px 0' }}/>

        <h3>Yeteneklerim</h3>
        {/* State'ten gelen güncel yetenekleri gösteriyoruz */}
        <ul>
          {user.skills.map(skill => <li key={skill.skillName}>{skill.skillName}</li>)}
        </ul>

        <hr style={{ margin: '20px 0' }}/>
        
        <h3>Portfolyom</h3>
        {user.demos.map(demo => (
          <div key={demo.id} style={{ border: '1px solid #444', padding: '8px', marginBottom: '8px' }}>
            <p><strong>{demo.title}</strong> ({demo.type})</p>
            <p>{demo.description}</p>
            {/* Buraya düzenle/sil butonları gelecek */}
          </div>
        ))}
      </div>

      {/* Sağ Taraf: Düzenleme Formları */}
      <div style={{ flex: 1, borderLeft: '1px solid #444', paddingLeft: '40px' }}>
        <h2>Bilgileri Düzenle</h2>
        
        <div style={{ marginBottom: '30px' }}>
          <h3>Profil Bilgileri</h3>
          <UpdateProfileForm 
            user={{ username: user.username, bio: user.bio }} 
            onProfileUpdate={handleProfileUpdate} 
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Yetenekleri Yönet</h3>
          {/* YER TUTUCUYU SİLİP YERİNE GERÇEK FORMU KOYUYORUZ */}
          <ManageSkillsForm 
            currentSkills={user.skills} 
            onSkillsUpdate={handleSkillsUpdate} 
          />
        </div>

        <div>
          <h3>Portfolyoyu Yönet</h3>
          {/* <ManageDemosForm demos={user.demos} onDemosUpdate={(newDemos) => setUser(prev => ({...prev, demos: newDemos}))} /> */}
           <p>[Buraya Demo Ekleme/Yönetme Formu (Dosya Yükleme ile) Gelecek]</p>
        </div>
      </div>

    </div>
  );
}