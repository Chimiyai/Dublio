// src/components/projects/ModderPanelClient.tsx

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Asset, TranslationLine } from '@prisma/client';
import { type ProjectForModder } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page';
import Select from 'react-select';

// Prop tipi
interface Props {
  project: ProjectForModder;
  initialLines: TranslationLine[]; 
}

// react-select için tip
interface SelectOption {
  value: number;
  label: string;
}

export default function ModderPanelClient({ project: initialProject, initialLines }: Props) {
    const router = useRouter();
    const [project, setProject] = useState(initialProject);
    const [translationLines, setTranslationLines] = useState(initialLines);
    const [isLoading, setIsLoading] = useState(false);
    
    // Sekme yönetimi
    const [activeTab, setActiveTab] = useState<'assets' | 'characters'>('assets');

    // Form state'leri
    const [newCharName, setNewCharName] = useState('');
    const [newCharImage, setNewCharImage] = useState('');
    const [assetFormats, setAssetFormats] = useState<{ [key: number]: string }>({});
    
    // Seçenekler
    const teamMemberOptions: SelectOption[] = project.team.members.map(member => ({
        value: member.userId,
        label: member.user.username,
    }));
    
    // === FONKSİYONLAR ===

    const handleToggleNonDialogue = async (assetId: number, currentValue: boolean) => {
        const toastId = toast.loading("Ayar güncelleniyor...");
        setIsLoading(true);
        try {
            const response = await fetch(`/api/assets/${assetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isNonDialogue: !currentValue }),
            });
            
            const updatedAsset: Asset = await response.json();
            if (!response.ok) throw new Error("Güncelleme başarısız.");

            setProject(prev => ({
                ...prev,
                assets: prev.assets.map(asset => 
                    asset.id === assetId ? { ...asset, isNonDialogue: updatedAsset.isNonDialogue } : asset
                )
            }));
            toast.success("Asset ayarı güncellendi.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

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
            setProject(prev => ({ ...prev, characters: [...prev.characters, characterWithRelations] }));
            setNewCharName('');
            setNewCharImage('');
            toast.success("Karakter eklendi!", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdateVoiceActors = async (characterId: number, selectedOptions: readonly SelectOption[]) => {
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

            setProject(prev => ({
                ...prev,
                characters: prev.characters.map(c => c.id === characterId ? updatedCharacter : c)
            }));
            toast.success("Seslendirmenler güncellendi.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleParseAsset = async (assetId: number) => {
        const format = assetFormats[assetId];
        if (!format) return toast.error("Lütfen bir işleme formatı seçin.");
        const toastId = toast.loading(`${format} formatında işleniyor...`);
        setIsLoading(true);
        try {
            const response = await fetch(`/api/assets/${assetId}/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            toast.success(result.message, { id: toastId });
            router.refresh();
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    // === JSX RENDER ===
    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #444', marginBottom: '20px' }}>
                <button onClick={() => setActiveTab('assets')} style={{ padding: '10px', border: 'none', background: activeTab === 'assets' ? 'purple' : 'transparent', color: 'white', cursor: 'pointer' }}>
                    Asset Yönetimi
                </button>
                <button onClick={() => setActiveTab('characters')} style={{ padding: '10px', border: 'none', background: activeTab === 'characters' ? 'purple' : 'transparent', color: 'white', cursor: 'pointer' }}>
                    Karakter Yönetimi
                </button>
            </div>

            {activeTab === 'assets' && (
                <div>
                    <h2>Proje Assetleri</h2>
                    <p style={{color: '#aaa', marginTop: '-5px', marginBottom: '20px'}}>
                        Projeye ait dosyaları yönetin ve metin dosyalarını çeviri için işleyin.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {project.assets.map(asset => (
                            <div key={asset.id} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px' }}>
                                <p><strong>{asset.name}</strong> ({asset.type})</p>
                                {asset.type === 'AUDIO' && (
                                    <>
                                        <audio src={asset.path} controls style={{ width: '100%', marginTop: '10px' }} />
                                        <div style={{ marginTop: '15px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox"
                                                    checked={asset.isNonDialogue}
                                                    onChange={() => handleToggleNonDialogue(asset.id, asset.isNonDialogue)}
                                                    disabled={isLoading}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                Diyalog Metni Yok (Sadece Ses Efekti/Müzik)
                                            </label>
                                        </div>
                                    </>
                                )}
                                {asset.type === 'TEXT' && (
                                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <select 
                                            value={assetFormats[asset.id] || ''}
                                            onChange={(e) => setAssetFormats(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                            style={{ padding: '8px' }}
                                        >
                                            <option value="" disabled>İşleyici Formatı Seç...</option>
                                            <option value="UNITY_I2LOC">Unity I2Loc JSON</option>
                                            <option value="UNREAL_LOCRES">Unreal Locres</option>
                                        </select>
                                        <button
                                            onClick={() => handleParseAsset(asset.id)}
                                            disabled={!assetFormats[asset.id] || isLoading}
                                        >
                                            İşle ve Satırları Oluştur
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'characters' && (
                <div>
                    {/* Karakter yönetimi JSX'i burada (önceki mesajdaki gibi) */}
                </div>
            )}
        </div>
    );
}