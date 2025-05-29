// src/components/admin/AddCharacterForm.tsx (Veya proje düzenleme formu içinde bir parça)
'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button'; // Shadcn/ui veya kendi butonunuz
import { Input } from '@/components/ui/input';   // Shadcn/ui veya kendi inputunuz

interface AddCharacterFormProps {
  projectId: number;
  onCharacterAdded: (newCharacter: any) => void; // Tipini ProjectCharacter yapın
}

export default function AddCharacterForm({ projectId, onCharacterAdded }: AddCharacterFormProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Karakter adı boş olamaz.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/project-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, projectId }),
      });
      const newCharacter = await response.json();
      if (!response.ok) {
        throw new Error(newCharacter.message || 'Karakter eklenemedi.');
      }
      toast.success(`"${newCharacter.name}" karakteri eklendi.`);
      onCharacterAdded(newCharacter); // Listeyi güncellemek için callback
      setName('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 mb-4">
      <div className="flex-grow">
        <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Yeni Karakter Adı
        </label>
        <Input
          id="characterName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Kratos"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading || !name.trim()}>
        {isLoading ? 'Ekleniyor...' : 'Karakter Ekle'}
      </Button>
    </form>
  );
}