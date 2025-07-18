// src/components/projects/ModderStudioClient.tsx
'use client';

// YENİ: İkonları ve useRouter'ı import ediyoruz.
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { type ProjectForModderStudio } from '@/types/modder';
import { TriageTab } from './TriageTab';
import Select, { type MultiValue } from 'react-select';
import { AssetLibraryTab } from './AssetLibraryTab';
import { ArrowPathIcon, CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';


// ===================================================================
// === BÖLÜM 1: Karakter Yönetimi Sekmesi (Değişiklik yok) ===
// ===================================================================
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
            const newCharacterData = await res.json();
            if (!res.ok) throw new Error(newCharacterData.message || "Karakter oluşturulamadı.");
            const newCharacter: ProjectForModderStudio['characters'][0] = { ...newCharacterData, voiceActors: [] };
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
            const updatedProject = { ...project, characters: project.characters.map(c => c.id === characterId ? updatedCharacter : c) };
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
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Karakter silinemedi.");
            }
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
                <form onSubmit={handleCreateCharacter} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="text" value={newCharName} onChange={e => setNewCharName(e.target.value)} placeholder="Karakter Adı" required style={{ padding: '8px' }} />
                    <input type="url" value={newCharImage} onChange={e => setNewCharImage(e.target.value)} placeholder="Resim URL'si (opsiyonel)" style={{ padding: '8px' }} />
                    <button type="submit" disabled={isLoading} style={{ padding: '8px 12px' }}>Ekle</button>
                </form>
            </div>
            <h3>Karakterler ve Seslendirmen Atamaları</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {project.characters.map((character: ProjectForModderStudio['characters'][0]) => (
                    <div key={character.id} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', position: 'relative' }}>
                        <button onClick={() => handleDeleteCharacter(character.id, character.name)} disabled={isLoading} style={{ position: 'absolute', top: '10px', right: '10px', background: 'darkred', border: 'none', color: 'white', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Karakteri Sil">X</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <img src={character.profileImage || '/images/default-avatar.png'} alt={`${character.name} profili`} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', background: '#333' }}/>
                            <p style={{ fontSize: '1.4rem', margin: 0 }}><strong>{character.name}</strong></p>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Seslendirmenler:</label>
                            <Select isMulti options={teamMemberOptions} defaultValue={character.voiceActors.map(va => ({ value: va.voiceActor.id, label: va.voiceActor.username }))} onChange={(selected: MultiValue<SelectOption>) => handleUpdateVoiceActors(character.id, selected)} isDisabled={isLoading} instanceId={`select-char-${character.id}`}/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ===================================================================
// === YENİ BÖLÜM: Gönderim Sekmesi ===
// ===================================================================
interface ReadinessStatus {
    unclassifiedAssetCount: number;
    isReadyForTranslation: boolean;
}

interface SubmissionTabProps {
    projectId: number;
    status: ReadinessStatus | null;
    onStatusUpdate: () => void; // Durumu yeniden çekmek için bir callback
}

const SubmissionTab = ({ projectId, status, onStatusUpdate }: SubmissionTabProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSendToTranslation = async () => {
        if (!status || status.unclassifiedAssetCount > 0) {
            toast.error('Önce tüm dosyaları Eşleştirme (Triyaj) sekmesinde işlemeniz gerekiyor.');
            return;
        }
        if (!confirm("Proje çeviri ekibine gönderilecek. Bu işlemden sonra asset yapısında değişiklik yapmanız önerilmez. Emin misiniz?")) {
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/ready-for-translation`, { method: 'POST' });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Proje gönderilemedi.');
            }
            toast.success('Proje çeviri ekibine başarıyla gönderildi!');
            onStatusUpdate(); // State'i güncellemek için ana component'teki fonksiyonu çağır
            router.refresh();
        } catch (error: any) {
            toast.error(`Hata: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!status) {
        return <p>Proje durumu yükleniyor...</p>;
    }
    
    if (status.isReadyForTranslation) {
        return (
            <div style={{ padding: '20px', background: '#2e7d32', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <CheckCircleIcon style={{ width: 40, height: 40 }} />
                <div>
                    <h3 style={{ margin: 0 }}>Proje Çeviride</h3>
                    <p style={{ margin: '5px 0 0 0' }}>Bu proje, çeviri ekibine gönderilmiştir ve şu anda çeviri stüdyosunda aktiftir.</p>
                </div>
            </div>
        )
    }

    const canSubmit = status.unclassifiedAssetCount === 0;

    return (
        <div style={{ padding: '20px', background: '#2a2a2a', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Proje Hazırlık Durumu</h3>
            <p>Çeviri stüdyosunu aktif hale getirmek için projedeki tüm dosyaların (asset) Eşleştirme (Triyaj) sekmesinde işlenmesi gerekmektedir.</p>
            <div style={{ margin: '20px 0', padding: '15px', background: canSubmit ? '#388e3c' : '#d32f2f', borderRadius: '4px' }}>
                {canSubmit 
                    ? "Tebrikler! Tüm dosyalar işlendi. Projeyi çeviriye gönderebilirsiniz." 
                    : `İşlenmesi gereken ${status.unclassifiedAssetCount} dosya daha var. Lütfen 'Eşleştirme (Triyaj)' sekmesini kontrol edin.`
                }
            </div>
            <button onClick={handleSendToTranslation} disabled={!canSubmit || isSubmitting} style={{ cursor: (!canSubmit || isSubmitting) ? 'not-allowed' : 'pointer', opacity: (!canSubmit || isSubmitting) ? 0.6 : 1, padding: '10px 20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isSubmitting 
                    ? <><ArrowPathIcon style={{width: 20, height: 20, animation: 'spin 1s linear infinite'}}/> Gönderiliyor...</> 
                    : <><PaperAirplaneIcon style={{width: 20, height: 20}} /> Çeviriye Gönder</>
                }
            </button>
        </div>
    );
};


// ===================================================================
// === DÜZENLENMİŞ Ana ModderStudioClient COMPONENT'İ ===
// ===================================================================
interface ModderStudioClientProps {
    projectId: number;
}

export default function ModderStudioClient({ projectId }: ModderStudioClientProps) {
    // DÜZENLEME: 'submission' sekmesi ve 'readinessStatus' state'i eklendi.
    const [activeTab, setActiveTab] = useState<'triage' | 'characters' | 'library' | 'submission'>('triage');
    const [project, setProject] = useState<ProjectForModderStudio | null>(null);
    const [readinessStatus, setReadinessStatus] = useState<ReadinessStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [triageRefreshKey, setTriageRefreshKey] = useState(0);

    // DÜZENLEME: Veri çekme fonksiyonu artık hem proje detaylarını hem de gönderim durumunu çekiyor.
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (isNaN(projectId)) throw new Error("Geçersiz Proje ID'si.");

            // İki API isteğini aynı anda yapıyoruz.
            const [projectRes, statusRes] = await Promise.all([
                fetch(`/api/modder-studio/${projectId}`),
                fetch(`/api/projects/${projectId}/readiness-status`)
            ]);

            if (!projectRes.ok) {
                const errorData = await projectRes.json();
                throw new Error(errorData.message || `Proje verisi alınamadı: ${projectRes.status}`);
            }
            if (!statusRes.ok) {
                const errorData = await statusRes.json();
                throw new Error(errorData.message || `Proje durumu alınamadı: ${statusRes.status}`);
            }

            const projectData: ProjectForModderStudio = await projectRes.json();
            const statusData: ReadinessStatus = await statusRes.json();
            
            setProject(projectData);
            setReadinessStatus(statusData);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // DÜZENLEME: fetchData artık useCallback içinde olduğu için bağımlılık listesi doğru.

    const handleProjectUpdate = (updatedProject: ProjectForModderStudio) => {
        setProject(updatedProject);
    };

    const handleParseSuccess = () => {
        setTriageRefreshKey(prevKey => prevKey + 1);
        fetchData(); // DÜZENLEME: Yeni assetler eklendiğinde durumu yeniden kontrol et.
        toast.success("Ayrıştırma tamamlandı! Eşleştirme sekmesi ve gönderim durumu güncellendi.");
        setActiveTab('triage');
    };
    
    // DÜZENLEME: Triage (eşleştirme) tamamlandığında durumu yeniden kontrol etmek için yeni fonksiyon.
    const handleTriageComplete = () => {
        toast.success("Eşleştirme işlemi kaydedildi. Gönderim durumu kontrol ediliyor...");
        fetchData(); // Durum API'sini tekrar çağırarak kalan asset sayısını güncelle
    };

    const renderActiveTab = () => {
        if (!project) return null; // Proje yüklenmediyse hiçbir şey gösterme
        switch (activeTab) {
            case 'triage':
                // DÜZENLEME: TriageTab'e onTriageComplete prop'u eklendi.
                return <TriageTab key={triageRefreshKey} projectId={project.id} allCharacters={project.characters} onTriageComplete={handleTriageComplete} />;
            case 'characters':
                return <CharacterManagerTab project={project} onProjectUpdate={handleProjectUpdate} />;
            case 'library':
                return <AssetLibraryTab projectId={project.id} onParseSuccess={handleParseSuccess} />;
            case 'submission':
                // YENİ: Yeni sekmemiz render ediliyor.
                return <SubmissionTab projectId={project.id} status={readinessStatus} onStatusUpdate={fetchData} />;
            default:
                return null;
        }
    };

    if (isLoading) return <div>Modder Stüdyosu yükleniyor...</div>;
    if (error) return <div>Hata: {error}</div>;
    if (!project) return <div>Proje verisi bulunamadı.</div>;

    // DÜZENLEME: Sekme sayısı ve gönderim durumu göstergesi eklendi.
    const unclassifiedCount = readinessStatus?.unclassifiedAssetCount ?? 0;
    const isReady = readinessStatus?.isReadyForTranslation ?? false;

    return (
        <div>
            <h1>Modder Stüdyosu: {project.name}</h1>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #444', margin: '20px 0' }}>
                <button onClick={() => setActiveTab('triage')} style={{ position: 'relative' }}>
                    Eşleştirme (Triyaj)
                    {unclassifiedCount > 0 && !isReady && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unclassifiedCount}</span>
                    )}
                </button>
                <button onClick={() => setActiveTab('characters')}>Karakter Yönetimi</button>
                <button onClick={() => setActiveTab('library')}>Asset Kütüphanesi</button>
                <button onClick={() => setActiveTab('submission')} style={{ marginLeft: 'auto', background: isReady ? 'green' : (unclassifiedCount === 0 ? 'purple' : 'default')}}>Gönderim</button>
            </div>
            <div>{renderActiveTab()}</div>
        </div>
    );
}