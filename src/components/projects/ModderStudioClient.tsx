// src/components/projects/ModderStudioClient.tsx

'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Asset, AssetClassification, TranslationLine } from '@prisma/client';
import { type ProjectForModderStudio } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page';
// DÜZELTME: react-select'ten tipleri doğru import etme
import Select, { type SingleValue, type MultiValue } from 'react-select';

// ===================================================================
// === TİPLER ve İÇ COMPONENT'LER ===
// ===================================================================

// react-select için tip
interface SelectOption {
  value: number;
  label: string;
}

// --- Karakter Yönetimi Sekmesi ---
const CharacterManagerTab = ({ project, onProjectUpdate }: { project: ProjectForModderStudio, onProjectUpdate: (updatedProject: ProjectForModderStudio) => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [newCharName, setNewCharName] = useState('');
    const [newCharImage, setNewCharImage] = useState('');

    const teamMemberOptions = project.team.members.map(member => ({
        value: member.userId,
        label: member.user.username,
    }));

    const handleCreateCharacter = async (e: FormEvent) => {
        e.preventDefault();
        if (!newCharName.trim()) return toast.error("Karakter adı boş olamaz.");
        const toastId = toast.loading("Karakter oluşturuluyor...");
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/characters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCharName, profileImage: newCharImage }),
            });
            const newCharacter = await res.json();
            if (!res.ok) throw new Error(newCharacter.message);

            const characterWithRelations = { ...newCharacter, voiceActors: [] };
            const updatedProject = { ...project, characters: [...project.characters, characterWithRelations] };
            onProjectUpdate(updatedProject);
            setNewCharName('');
            setNewCharImage('');
            toast.success("Karakter eklendi!", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateVoiceActors = async (characterId: number, selectedOptions: MultiValue<SelectOption>) => {
        const voiceActorIds = selectedOptions.map(opt => opt.value);
        const toastId = toast.loading("Seslendirmenler güncelleniyor...");
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/characters/${characterId}/voice-actors`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceActorIds }),
            });
            const updatedCharacter = await res.json();
            if (!res.ok) throw new Error(updatedCharacter.message);

            const updatedProject = { ...project, characters: project.characters.map(c => c.id === characterId ? updatedCharacter : c) };
            onProjectUpdate(updatedProject);
            toast.success("Seslendirmenler güncellendi.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };
    // === YENİ FONKSİYON: Karakter Silme ===
    const handleDeleteCharacter = async (characterId: number, characterName: string) => {
        if (!confirm(`'${characterName}' karakterini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
            return;
        }

        const toastId = toast.loading("Karakter siliniyor...");
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/characters/${characterId}`, {
                method: 'DELETE',
            });
            
            if (res.status !== 204) { // Başarılı silme işleminde 204 döner
                const errorData = await res.json();
                throw new Error(errorData.message || "Karakter silinemedi.");
            }
            
            // Client state'inden karakteri kaldır
            const updatedProject = { ...project, characters: project.characters.filter(c => c.id !== characterId) };
            onProjectUpdate(updatedProject);

            toast.success("Karakter başarıyla silindi.", { id: toastId });

        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '40px' }}>
                <h3>Yeni Karakter Ekle</h3>
                <form onSubmit={handleCreateCharacter} style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={newCharName} onChange={e => setNewCharName(e.target.value)} placeholder="Karakter Adı" required />
                    <input type="url" value={newCharImage} onChange={e => setNewCharImage(e.target.value)} placeholder="Resim URL'si" />
                    <button type="submit" disabled={isLoading}>Ekle</button>
                </form>
            </div>
            <h3>Karakterler ve Seslendirmen Atamaları</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {project.characters.map(character => (
                    <div key={character.id} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', position: 'relative' }}>
                        {/* === YENİ: Silme Butonu === */}
                        <button 
                            onClick={() => handleDeleteCharacter(character.id, character.name)}
                            disabled={isLoading}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'darkred', border: 'none', color: 'white', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%' }}
                            title="Karakteri Sil"
                        >
                            X
                        </button>

                        {/* === GÜNCELLEME: Resim Önizleme === */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <img 
                                src={character.profileImage || '/images/default-avatar.png'} 
                                alt={`${character.name} profili`} 
                                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', background: '#333' }}
                            />
                            <p style={{ fontSize: '1.4rem', margin: 0 }}><strong>{character.name}</strong></p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Seslendirmenler:</label>
                            <Select
                            isMulti
                            options={teamMemberOptions}
                            value={character.voiceActors.map(va => ({ value: va.voiceActor.id, label: va.voiceActor.username }))}
                            onChange={(selected) => handleUpdateVoiceActors(character.id, selected)}
                            isDisabled={isLoading}
                        />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// === ANA KAPSAYICI COMPONENT ===
interface Props {
  project: ProjectForModderStudio;
  initialLines: TranslationLine[];
}

export default function ModderStudioClient({ project: initialProject }: Props) {
    const [activeTab, setActiveTab] = useState<'triage' | 'characters' | 'library'>('triage');
    const [project, setProject] = useState(initialProject);

    const handleProjectUpdate = (updatedProject: ProjectForModderStudio) => {
        setProject(updatedProject);
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'triage':
                // TriageTab component'ini buraya koyacağız
                return <div>Triyaj Stüdyosu (Yakında)</div>;
            case 'characters':
                return <CharacterManagerTab project={project} onProjectUpdate={handleProjectUpdate} />;
            case 'library':
                return <div>Asset Kütüphanesi (Yakında)</div>;
            default:
                return null;
        }
    };
    
    return (
        <div>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #444', margin: '20px 0' }}>
                <button onClick={() => setActiveTab('triage')} style={{ background: activeTab === 'triage' ? 'purple' : 'transparent' }}>Eşleştirme (Triyaj)</button>
                <button onClick={() => setActiveTab('characters')} style={{ background: activeTab === 'characters' ? 'purple' : 'transparent' }}>Karakter Yönetimi</button>
                <button onClick={() => setActiveTab('library')} style={{ background: activeTab === 'library' ? 'purple' : 'transparent' }}>Asset Kütüphanesi</button>
            </div>
            <div>{renderActiveTab()}</div>
        </div>
    );
}