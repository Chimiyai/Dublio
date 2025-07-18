//src/components/projects/ModderStudioClient.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { type ProjectForModderStudio } from '@/types/modder'; 
import { TriageTab } from './TriageTab';
import Select, { type MultiValue } from 'react-select';
import { AssetLibraryTab } from './AssetLibraryTab';

interface SelectOption {
  value: number;
  label: string;
}

const CharacterManagerTab = ({ project, onProjectUpdate }: { project: ProjectForModderStudio, onProjectUpdate: (updatedProject: ProjectForModderStudio) => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [newCharName, setNewCharName] = useState('');
    const [newCharImage, setNewCharImage] = useState('');

    const teamMemberOptions = project.team.members.map((member: any) => ({
        value: member.userId,
        label: member.user.username, // Artık hata vermeyecek
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
            const newCharacterData = await res.json();
            if (!res.ok) throw new Error(newCharacterData.message || "Karakter oluşturulamadı.");

            // DÜZELTME: Gelen veriye doğru tipi atayarak state'in tutarlı kalmasını sağlıyoruz.
            const newCharacter: ProjectForModderStudio['characters'][0] = { 
                ...newCharacterData, 
                voiceActors: [] 
            };
            
            const updatedProject = { ...project, characters: [...project.characters, newCharacter] };
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
        const voiceActorIds = selectedOptions.map((opt: SelectOption) => opt.value);
        const toastId = toast.loading("Seslendirmenler güncelleniyor...");
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/characters/${characterId}/voice-actors`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceActorIds }),
            });
            const updatedCharacter = await res.json();
            if (!res.ok) throw new Error(updatedCharacter.message || "Güncelleme başarısız.");

            const updatedProject = { 
                ...project, 
                characters: project.characters.map(c => c.id === characterId ? updatedCharacter : c) 
            };
            onProjectUpdate(updatedProject);
            toast.success("Seslendirmenler güncellendi.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCharacter = async (characterId: number, characterName: string) => {
        if (!confirm(`'${characterName}' karakterini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;

        const toastId = toast.loading("Karakter siliniyor...");
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/characters/${characterId}`, { method: 'DELETE' });
            if (res.status !== 204) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Karakter silinemedi.");
            }
            const updatedProject = { ...project, characters: project.characters.filter(c => c.id !== characterId) };
            onProjectUpdate(updatedProject);
            toast.success("Karakter başarıyla silindi.", { id: toastId });
        } catch (error: any) {
            // DÜZELTME: Eksik olan süslü parantezleri ekliyoruz.
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '40px' }}>
                <h3>Yeni Karakter Ekle</h3>
                <form onSubmit={handleCreateCharacter} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="text" value={newCharName} onChange={e => setNewCharName(e.target.value)} placeholder="Karakter Adı" required style={{ padding: '8px' }} />
                    <input type="url" value={newCharImage} onChange={e => setNewCharImage(e.target.value)} placeholder="Resim URL'si (opsiyonel)" style={{ padding: '8px' }} />
                    <button type="submit" disabled={isLoading} style={{ padding: '8px 12px' }}>Ekle</button>
                </form>
            </div>
            <h3>Karakterler ve Seslendirmen Atamaları</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {project.characters.map((character: ProjectForModderStudio['characters'][0]) => ( // Tip eklendi
                    <div key={character.id} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', position: 'relative' }}>
                        <button 
                            onClick={() => handleDeleteCharacter(character.id, character.name)}
                            disabled={isLoading}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'darkred', border: 'none', color: 'white', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Karakteri Sil"
                        >
                            X
                        </button>
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
                                defaultValue={character.voiceActors.map(va => ({ value: va.voiceActor.id, label: va.voiceActor.username }))}
                                onChange={(selected: MultiValue<SelectOption>) => handleUpdateVoiceActors(character.id, selected)}
                                isDisabled={isLoading}
                                instanceId={`select-char-${character.id}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ===================================================================
// === Ana ModderStudioClient COMPONENT'İ ===
// ===================================================================
interface ModderStudioClientProps {
  projectId: number;
}

export default function ModderStudioClient({ projectId }: ModderStudioClientProps) {
    const [activeTab, setActiveTab] = useState<'triage' | 'characters' | 'library'>('triage');
    const [project, setProject] = useState<ProjectForModderStudio | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [triageRefreshKey, setTriageRefreshKey] = useState(0);

    useEffect(() => {
        // Fonksiyonu SADECE BİR KEZ tanımlıyoruz.
        const fetchProjectData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // projectId kontrolünü try bloğunun dışına taşıyabiliriz,
                // ama burada kalması da sorun değil.
                if (isNaN(projectId)) {
                    throw new Error("Geçersiz Proje ID'si.");
                }

                const res = await fetch(`/api/modder-studio/${projectId}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || `Hata: ${res.status}`);
                }
                const data: ProjectForModderStudio = await res.json();
                setProject(data);
            } catch (err: any) {
                setError(err.message);
                // toast.error(err.message); // Hata mesajını iki kez göstermemek için bunu kaldırabiliriz.
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectData();
    }, [projectId]);

    if (isLoading) return <div>Modder Stüdyosu yükleniyor...</div>;
    if (error) return <div>Hata: {error}</div>;
    if (!project) return <div>Proje verisi bulunamadı.</div>;
    
    const handleProjectUpdate = (updatedProject: ProjectForModderStudio) => {
        setProject(updatedProject);
    };

    // YENİ FONKSİYON: AssetLibraryTab'den bu fonksiyonu çağıracağız
    const handleParseSuccess = () => {
        // Key'i değiştirerek TriageTab component'inin yeniden mount olmasını tetikle
        setTriageRefreshKey(prevKey => prevKey + 1);
        // Kullanıcıyı bilgilendirip doğru sekmeye yönlendir
        toast.success("Ayrıştırma tamamlandı! Eşleştirme sekmesi güncellendi.");
        setActiveTab('triage');
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'triage':
                return <TriageTab key={triageRefreshKey} projectId={project.id} allCharacters={project.characters} />;
            case 'characters':
                return <CharacterManagerTab project={project} onProjectUpdate={setProject} />;
            case 'library':
                return <AssetLibraryTab projectId={project.id} onParseSuccess={handleParseSuccess} />;
            default:
                return null;
        }
    };
    
    return (
        <div>
            <h1>Modder Stüdyosu: {project.name}</h1>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #444', margin: '20px 0' }}>
                <button onClick={() => setActiveTab('triage')}>Eşleştirme (Triyaj)</button>
                <button onClick={() => setActiveTab('characters')}>Karakter Yönetimi</button>
                <button onClick={() => setActiveTab('library')}>Asset Kütüphanesi</button>
            </div>
            <div>{renderActiveTab()}</div>
        </div>
    );
}