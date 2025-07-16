//src/components/profile/ProfileManagementContent.tsx
'use client';

import { useState } from 'react';
import { UserForManagement } from '@/app/profil/page';
// DİKKAT: Artık bir sürü tipe ihtiyacımız var.
import { UserSkill, UserDemo, Skill, DemoCategory, Content } from '@prisma/client';
import UpdateProfileForm from './UpdateProfileForm'; 
import ManageSkillsForm from './ManageSkillsForm';
import ManageDemos from './ManageDemos';

// --- HATA 1'i burada çözüyoruz: Props arayüzünü güncelliyoruz ---
interface Props {
  user: UserForManagement;
  allSkills: Skill[];
  demoCategories: DemoCategory[]; // <-- YENİ
  allContents: { id: number, title: string }[]; // <-- YENİ
}

export default function ProfileManagementContent({ 
  user: initialUser, 
  allSkills, 
  demoCategories, // <-- YENİ
  allContents     // <-- YENİ
}: Props) {
  const [user, setUser] = useState(initialUser);

  // Callback fonksiyonları (Bunlarda değişiklik yok)
  const handleProfileUpdate = (updatedData: Partial<UserForManagement>) => {
    setUser(prevUser => ({ ...prevUser, ...updatedData }));
  };
  const handleSkillsUpdate = (newSkills: (UserSkill & { skill: Skill })[]) => {
    setUser(prevUser => ({ ...prevUser, skills: newSkills }));
  };
  const handleDemosUpdate = (newDemos: UserDemo[]) => {
    setUser(prevUser => ({ ...prevUser, demos: newDemos }));
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
        <ul>
          {/* HATA 2 & 3'ü burada çözüyoruz. Artık skill objesine sahibiz. */}
          {user.skills.map(userSkill => (
             <li key={userSkill.skill.id}>  {/* <-- DÜZELTME 1 */}
              {userSkill.skill.name}        {/* <-- DÜZELTME 2 */}
            </li>
          ))}
        </ul>

        <hr style={{ margin: '20px 0' }}/>
        
        <h3>Portfolyom</h3>
        {/* State'ten gelen güncel demoları gösteriyoruz */}
        {user.demos.map(demo => (
          <div key={demo.id} style={{ border: '1px solid #444', padding: '8px', marginBottom: '8px' }}>
            <p><strong>{demo.title}</strong> ({demo.type})</p>
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
          <ManageSkillsForm 
            currentSkills={user.skills} 
            onSkillsUpdate={handleSkillsUpdate} 
            allSkills={allSkills}
          />
        </div>

        <div>
          <h3>Portfolyoyu Yönet</h3>
           {/* --- HATA 2'yi burada çözüyoruz: Eksik propları ekliyoruz --- */}
           <ManageDemos 
             demos={user.demos}
             onDemosUpdate={handleDemosUpdate}
             userSkills={user.skills} // <-- YENİ
             demoCategories={demoCategories} // <-- YENİ
             allContents={allContents} // <-- YENİ
           />
        </div>
      </div>
    </div>
  );
}