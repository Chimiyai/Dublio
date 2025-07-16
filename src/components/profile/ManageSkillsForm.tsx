//src/components/profile/ManageSkillsForm.tsx
'use client';

import { useState, KeyboardEvent, FC } from 'react';
import { UserSkill } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ManageSkillsFormProps {
  currentSkills: UserSkill[];
  onSkillsUpdate: (updatedSkills: UserSkill[]) => void;
}

const ManageSkillsForm: FC<ManageSkillsFormProps> = ({ currentSkills, onSkillsUpdate }) => {
  // State'lerimizi tanımlıyoruz
  const [skills, setSkills] = useState<string[]>(currentSkills.map(s => s.skillName));
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSkill = () => {
    const newSkill = inputValue.trim();
    // Yetenek boş değilse, daha önce eklenmemişse ve en fazla 10 yetenek varsa ekle
    if (newSkill && !skills.includes(newSkill) && skills.length < 10) {
      setSkills([...skills, newSkill]);
      setInputValue(''); // Input'u temizle
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };
  
  // Enter tuşuna basıldığında da yetenek eklemesini sağlayan fonksiyon
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Formun submit olmasını engelle
      handleAddSkill();
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    toast.loading('Yetenekler güncelleniyor...');

    try {
      const response = await fetch('/api/profile/update-skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }), // Mevcut skill listesini gönder
      });

      const data = await response.json();
      toast.dismiss();

      if (!response.ok) {
        throw new Error(data.message || 'Bir hata oluştu.');
      }
      
      toast.success('Yetenekler başarıyla güncellendi!');
      onSkillsUpdate(data); // Ana bileşeni yeni veriyle güncelle

    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Yetenek Etiketleri */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', background: '#333', border: '1px solid #555', borderRadius: '5px', minHeight: '40px' }}>
        {skills.map(skill => (
          <div key={skill} style={{ display: 'flex', alignItems: 'center', background: 'purple', padding: '5px 10px', borderRadius: '15px' }}>
            <span>{skill}</span>
            <button onClick={() => handleRemoveSkill(skill)} style={{ background: 'none', border: 'none', color: 'white', marginLeft: '8px', cursor: 'pointer' }}>
              <XMarkIcon style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        ))}
      </div>

      {/* Yetenek Ekleme Alanı */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Yeni yetenek ekle (örn: Çeviri)"
          style={{ flex: 1, padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
        />
        <button type="button" onClick={handleAddSkill} style={{ padding: '8px 15px', background: '#444', border: 'none', color: 'white' }}>
          Ekle
        </button>
      </div>

      {/* Kaydet Butonu */}
      <button onClick={handleSubmit} disabled={isLoading} style={{ width: '100%', marginTop: '20px', padding: '10px', background: isLoading ? '#555' : 'purple', color: 'white', border: 'none', cursor: 'pointer' }}>
        {isLoading ? 'Kaydediliyor...' : 'Yetenekleri Kaydet'}
      </button>
    </div>
  );
};

export default ManageSkillsForm;