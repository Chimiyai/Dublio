//src/components/profile/ManageSkillsForm.tsx
'use client';

import { useState, FC } from 'react';
import { UserSkill, Skill } from '@prisma/client';
import { toast } from 'react-hot-toast';

interface ManageSkillsFormProps {
  currentSkills: UserSkill[];
  allSkills: Skill[]; // Platformdaki tüm yetenekler
  onSkillsUpdate: (updatedSkills: (UserSkill & { skill: Skill })[]) => void;
}

const ManageSkillsForm: FC<ManageSkillsFormProps> = ({ currentSkills, allSkills, onSkillsUpdate }) => {
  // Artık yetenek ID'lerini tutan bir state'imiz var.
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<number>>(
    new Set(currentSkills.map(s => s.skillId))
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckboxChange = (skillId: number) => {
    const newSelectedIds = new Set(selectedSkillIds);
    if (newSelectedIds.has(skillId)) {
      newSelectedIds.delete(skillId);
    } else {
      newSelectedIds.add(skillId);
    }
    setSelectedSkillIds(newSelectedIds);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    toast.loading('Yetenekler güncelleniyor...');

    try {
      const response = await fetch('/api/profile/update-skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillIds: Array.from(selectedSkillIds) }),
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok) throw new Error(data.message || 'Hata');
      
      toast.success('Yetenekler güncellendi!');
      onSkillsUpdate(data);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #555', padding: '10px' }}>
        {allSkills.map(skill => (
          <div key={skill.id}>
            <input
              type="checkbox"
              id={`skill-${skill.id}`}
              checked={selectedSkillIds.has(skill.id)}
              onChange={() => handleCheckboxChange(skill.id)}
            />
            <label htmlFor={`skill-${skill.id}`} style={{ marginLeft: '8px' }}>
              {skill.name}
            </label>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={isLoading} style={{ width: '100%', marginTop: '20px', padding: '10px', background: 'purple' }}>
        {isLoading ? 'Kaydediliyor...' : 'Yetenekleri Kaydet'}
      </button>
    </div>
  );
};

export default ManageSkillsForm;