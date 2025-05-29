// src/components/admin/ProjectCharactersManager.tsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PlusCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface ProjectCharacterData {
  id: number;
  name: string;
  projectSlug: number;
}

interface ProjectCharactersManagerProps {
  projectSlug: string | undefined; // Listeleme için, useEffect'te kullanılır
  projectId: number | undefined;   // CRUD işlemleri için proje ID'si
  onCharactersUpdate: (characters: ProjectCharacterData[]) => void;
  isFormPending: boolean;
  isEditing: boolean; // YENİ PROP: Formun düzenleme modunda olup olmadığını belirtir
}

export default function ProjectCharactersManager({
  projectSlug,
  projectId,
  onCharactersUpdate,
  isFormPending,
  isEditing, // YENİ PROP
}: ProjectCharactersManagerProps) {
  const [projectCharacters, setProjectCharacters] = useState<ProjectCharacterData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<ProjectCharacterData | null>(null);
  const [editingCharacterName, setEditingCharacterName] = useState('');

  useEffect(() => {
    // Sadece düzenleme modunda VE projectSlug varsa karakterleri fetch et
    if (isEditing && projectSlug) {
      setIsLoading(true);
      fetch(`/api/admin/projects/${projectSlug}/characters`)
        .then(res => {
          if (!res.ok) {
            res.json().then(errData => {
                toast.error(errData.message || 'Karakterler yüklenemedi.');
            }).catch(() => {
                toast.error('Karakterler yüklenemedi (sunucu yanıtı okunamadı).');
            });
            throw new Error('Karakterler yüklenemedi.');
          }
          return res.json();
        })
        .then((data: ProjectCharacterData[]) => {
          setProjectCharacters(data);
          onCharactersUpdate(data); // Ana formu güncelle
        })
        .catch(err => {
            console.error("Karakter fetch hatası:", err);
            setProjectCharacters([]);
            onCharactersUpdate([]);
        })
        .finally(() => setIsLoading(false));
    } else if (!isEditing) {
      // Yeni proje modundaysak, karakter listesini boşalt (çünkü proje ID'si yok)
      setProjectCharacters([]);
      onCharactersUpdate([]);
    }
  }, [isEditing, projectSlug, onCharactersUpdate]);


  const handleAddCharacter = async () => {
    if (!newCharacterName.trim()) {
      toast.error('Karakter adı boş olamaz.');
      return;
    }
    // Sadece düzenleme modunda (yani proje ID'si varsa) karakter ekle
    if (!isEditing || !projectId) {
      toast.error('Karakter ekleyebilmek için önce projeyi kaydetmelisiniz.');
      return;
    }
    // ... (mevcut API isteği ve sonrası, projectId'yi kullanır)
    const toastId = toast.loading('Karakter ekleniyor...');
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/project-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCharacterName, projectId: projectId }), // projectId kullanılıyor
      });
      // ... (hata kontrolü ve state güncelleme)
      if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.message || 'Karakter eklenemedi.');
      }
      const addedChar: ProjectCharacterData = await response.json(); 
      toast.success(`"${addedChar.name}" karakteri eklendi.`);
      const updatedChars = [...projectCharacters, addedChar];
      setProjectCharacters(updatedChars);
      onCharactersUpdate(updatedChars);
      setNewCharacterName('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      toast.dismiss(toastId);
      setIsLoading(false);
    }
  };

  const handleDeleteCharacter = async (characterId: number) => {
    if (!isEditing || !projectId) return;
    if (!confirm("Bu karakteri silmek istediğinizden emin misiniz? Bu karakterle ilişkili tüm seslendirme atamaları da silinecektir.")) return;
    const toastId = toast.loading('Karakter siliniyor...');
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/project-characters/${characterId}`, {
        method: 'DELETE',
      });
      // Silme işleminde API'miz { message: "..." } döndürüyor, ProjectCharacterData değil.
      const result: { message: string } = await response.json(); 
      if (!response.ok) {
        throw new Error(result.message || 'Karakter silinemedi.');
      }
      toast.success(result.message);
      const updatedChars = projectCharacters.filter(char => char.id !== characterId);
      setProjectCharacters(updatedChars);
      onCharactersUpdate(updatedChars);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      toast.dismiss(toastId);
      setIsLoading(false);
    }
  };
  
  const startEditCharacter = (character: ProjectCharacterData) => {
    if (!isEditing) return;
    setEditingCharacter(character);
    setEditingCharacterName(character.name);
  };

  const handleUpdateCharacter = async () => {
    if (!isEditing || !projectId || !editingCharacter) return;
    if (!editingCharacter || !editingCharacterName.trim()) {
        toast.error('Düzenlenecek karakter veya yeni isim eksik.');
        return;
    }
    const toastId = toast.loading('Karakter güncelleniyor...');
    setIsLoading(true);
    try {
        const response = await fetch(`/api/admin/project-characters/${editingCharacter.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editingCharacterName }),
        });

        if (!response.ok) {
            // Hata durumunda JSON'u ayrı parse et
            const errorData = await response.json();
            throw new Error(errorData.message || 'Karakter güncellenemedi.');
        }

        // Sadece başarılıysa ProjectCharacterData olarak parse et
        const updatedChar: ProjectCharacterData = await response.json();
        
        toast.success(`Karakter "${updatedChar.name}" olarak güncellendi.`);
        const updatedCharsArray = projectCharacters.map(char => char.id === updatedChar.id ? updatedChar : char)
        setProjectCharacters(updatedCharsArray);
        onCharactersUpdate(updatedCharsArray);
        setEditingCharacter(null);
        setEditingCharacterName('');
    } catch (error: any) {
        toast.error(error.message);
    } finally {
        toast.dismiss(toastId);
        setIsLoading(false);
    }
  };
return (
    <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
      <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">
        Proje Karakterleri
      </h2>
      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
        Bu projede yer alan karakterleri yönetin. Seslendirme sanatçıları bu karakterlere atanacaktır.
      </p>
      
      {/* Sadece DÜZENLEME modunda ve proje ID/slug varsa karakter yönetimini göster */}
      {isEditing && (projectSlug || projectId) ? (
        <div className="mt-6">
          {/* Yeni Karakter Ekleme Formu */}
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-grow">
              <label htmlFor={`char-manager-newCharacterName-${projectId || projectSlug}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yeni Karakter Adı
              </label>
              <input
                type="text"
                id={`char-manager-newCharacterName-${projectId || projectSlug}`}
                value={newCharacterName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCharacterName(e.target.value)}
                placeholder="Karakter adı girin..."
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800"
                disabled={isLoading || isFormPending}
              />
            </div>
            <button
              type="button"
              onClick={handleAddCharacter}
              disabled={!newCharacterName.trim() || isLoading || isFormPending}
              className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm h-[38px] flex items-center disabled:opacity-50"
            >
              <PlusCircleIcon className="w-5 h-5 mr-1" /> Ekle
            </button>
          </div>

          {/* Karakter Listesi */}
          {isLoading && projectCharacters.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Karakterler yükleniyor...</p>}
          {!isLoading && projectCharacters.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Bu proje için henüz karakter eklenmemiş.</p>
          )}
          {!isLoading && projectCharacters.length > 0 && (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
              {projectCharacters.map((char) => (
                <li key={char.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  {editingCharacter?.id === char.id ? (
                      <div className="flex-grow flex items-center gap-2">
                          <input 
                              type="text"
                              value={editingCharacterName}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCharacterName(e.target.value)}
                              className="block w-full rounded-md border-0 py-1 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-gray-800"
                              disabled={isLoading} // Düzenleme sırasında da yükleme durumu dikkate alınabilir
                          />
                          <button type="button" onClick={handleUpdateCharacter} disabled={isLoading || !editingCharacterName.trim()} className="text-green-600 hover:text-green-500 text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900 dark:text-green-300 disabled:opacity-50">Kaydet</button>
                          <button type="button" onClick={() => setEditingCharacter(null)} disabled={isLoading} className="text-gray-600 hover:text-gray-500 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50">İptal</button>
                      </div>
                  ) : (
                      <span className="font-medium text-gray-900 dark:text-gray-100">{char.name}</span>
                  )}
                  {(!editingCharacter || editingCharacter.id !== char.id) && ( // Düzenleme modunda değilse veya bu karakter düzenlenmiyorsa butonları göster
                      <div className="flex items-center gap-2">
                      <button
                          type="button"
                          onClick={() => startEditCharacter(char)}
                          className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                          title="Düzenle"
                          disabled={isLoading || isFormPending || !!editingCharacter} // isFormPending ve !!editingCharacter eklendi
                      >
                          <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                          type="button"
                          onClick={() => handleDeleteCharacter(char.id)}
                          className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                          title="Sil"
                          disabled={isLoading || isFormPending || !!editingCharacter} // isFormPending ve !!editingCharacter eklendi
                      >
                          <TrashIcon className="w-4 h-4" />
                      </button>
                      </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-orange-500 bg-orange-100 dark:bg-orange-900 dark:text-orange-300 p-3 rounded-md">
          Karakter ekleyebilmek veya yönetebilmek için lütfen önce projeyi kaydedin.
        </p>
      )}
    </div>
  );
}