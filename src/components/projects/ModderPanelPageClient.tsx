// src/components/projects/ModderPanelPageClient.tsx

'use client';

import { useState, FormEvent } from 'react';
import { TeamMember, User } from '@prisma/client';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { 
    CharacterWithVoiceActors, 
    TranslationLineForModder,
    ProjectAssetSettingWithAsset
} from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page';

// Tipler
interface SelectOption { value: number; label: string; }
type VoiceActorUser = Pick<User, 'id' | 'username' | 'profileImage'>;
type TeamMemberWithUser = TeamMember & { user: VoiceActorUser };

interface Props {
  initialCharacters: CharacterWithVoiceActors[];
  allTeamMembers: TeamMemberWithUser[];
  projectId: number;
  viewerRole: string;
  initialAssetSettings: ProjectAssetSettingWithAsset[]; 
  allTranslationLines: TranslationLineForModder[];
}

export default function ModderPanelPageClient({ 
  initialCharacters, 
  allTeamMembers, 
  projectId, 
  viewerRole, 
  initialAssetSettings, 
  allTranslationLines 
}: Props) {
  // === STATE TANIMLAMALARI ===
  const [characters, setCharacters] = useState<CharacterWithVoiceActors[]>(initialCharacters);
  const [activeTab, setActiveTab] = useState<'characters' | 'mapping'>('characters');
  const [assetSettings, setAssetSettings] = useState<ProjectAssetSettingWithAsset[]>(initialAssetSettings);
  const [mappingLines, setMappingLines] = useState<TranslationLineForModder[]>(allTranslationLines);
  
  // Karakter oluşturma formu için state'ler
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharImage, setNewCharImage] = useState('');
  const [isCreatingChar, setIsCreatingChar] = useState(false);

  // === SEÇENEKLER ===
  const characterOptions: SelectOption[] = characters.map(char => ({ value: char.id, label: char.name }));
  const voiceActorOptions: SelectOption[] = allTeamMembers.map(member => ({ value: member.user.id, label: member.user.username }));
  const audioAssetOptions: SelectOption[] = assetSettings.map(setting => ({ value: setting.asset.id, label: setting.asset.name }));

  // === FONKSİYONLAR ===
  
  const handleCreateCharacter = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) { toast.error("Karakter adı boş olamaz."); return; }
    setIsCreatingChar(true);
    toast.loading("Karakter oluşturuluyor...");
    try {
      const res = await fetch(`/api/projects/${projectId}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCharName, description: newCharDesc, profileImage: newCharImage }),
      });
      const newChar = await res.json();
      toast.dismiss();
      if (!res.ok) throw new Error(newChar.message || "Karakter oluşturulamadı.");
      toast.success("Karakter başarıyla eklendi!");
      setCharacters(prev => [...prev, newChar]);
      setNewCharName(''); setNewCharDesc(''); setNewCharImage('');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsCreatingChar(false);
    }
  };
  
  const handleUpdateVoiceActors = async (characterId: number, selectedOptions: readonly SelectOption[]) => {
    const voiceActorIds = selectedOptions.map(option => option.value);
    toast.loading("Seslendirmenler güncelleniyor...");
    try {
      const res = await fetch(`/api/projects/${projectId}/characters/${characterId}/voice-actors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceActorIds }),
      });
      const updatedCharacter = await res.json();
      toast.dismiss();
      if (!res.ok) throw new Error(updatedCharacter.message || "Seslendirmenler güncellenemedi.");
      setCharacters(prev => prev.map(char => char.id === characterId ? updatedCharacter : char));
      toast.success("Seslendirmenler güncellendi!");
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };
  
  const handleUpdateAssetSetting = async (assetId: number, isNonDialogue: boolean) => {
    toast.loading("Ayar güncelleniyor...");
    try {
      const res = await fetch(`/api/projects/${projectId}/asset-settings/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isNonDialogue }),
      });
      const updatedSetting = await res.json();
      toast.dismiss();

      if (!res.ok) throw new Error(updatedSetting.message || "Ayar güncellenemedi.");

      setAssetSettings(prev => 
        prev.map(setting => 
          setting.assetId === assetId ? updatedSetting : setting
        )
      );
      toast.success("Asset ayarı güncellendi!");
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };
  
  const handleUpdateMappingLine = async (lineId: number, updateData: {
    characterId?: number | null, 
    originalVoiceReferenceAssetId?: number | null,
    isNonDialogue?: boolean
  }) => {
    toast.loading("Satır eşleştirmesi güncelleniyor...");
    try {
        const res = await fetch(`/api/translation-lines/${lineId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });
        const updatedLine = await res.json();
        toast.dismiss();
        if (!res.ok) throw new Error(updatedLine.message || "Güncelleme başarısız.");

        setMappingLines(prev => prev.map(line => line.id === lineId ? updatedLine : line));
        toast.success("Eşleştirme güncellendi!");
    } catch (error: any) {
        toast.dismiss();
        toast.error(error.message);
    }
  };

  // === JSX RENDER ===
  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Modder Paneli</h1>
      <p>Proje karakterlerini ve seslendirme atamalarını buradan yönetin.</p>

      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #444', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('characters')} style={{ padding: '10px 15px', background: activeTab === 'characters' ? 'purple' : '#333', color: 'white', border: 'none', cursor: 'pointer' }}>
          Karakter Yönetimi
        </button>
        <button onClick={() => setActiveTab('mapping')} style={{ padding: '10px 15px', background: activeTab === 'mapping' ? 'purple' : '#333', color: 'white', border: 'none', cursor: 'pointer' }}>
          Ses/Metin Eşleştirme
        </button>
      </div>

      {activeTab === 'characters' && (
        <>
          <hr style={{ margin: '30px 0' }} />
          <h2>Yeni Karakter Ekle</h2>
          <form onSubmit={handleCreateCharacter} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
             {/* Form elemanları buraya gelecek */}
          </form>

          <hr style={{ margin: '30px 0' }} />
          <h2>Karakter Listesi ({characters.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {characters.map(char => (
              <div key={char.id} style={{ background: '#1c1c1c', padding: '15px', borderRadius: '8px' }}>
                <img src={char.profileImage || `https://ui-avatars.com/api/?name=${char.name}`} alt={char.name} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '10px' }} />
                <h3>{char.name}</h3>
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Seslendirmenler:</strong></p>
                  <Select
                    isMulti
                    options={voiceActorOptions}
                    value={char.voiceActors.map(va => ({ value: va.voiceActor.id, label: va.voiceActor.username }))}
                    onChange={(selected) => handleUpdateVoiceActors(char.id, selected as readonly SelectOption[])}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'mapping' && (
        <>
          <hr style={{ margin: '30px 0' }} />
          <h2>Ses/Metin Eşleştirme</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
            <div>
              <h3>Orijinal Ses Assetleri ({assetSettings.length})</h3>
              <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #444', padding: '10px' }}>
                {assetSettings.map(setting => {
                    const asset = setting.asset;
                    const relatedLine = mappingLines.find(line => line.originalVoiceReferenceAssetId === asset.id);

                    return (
                      <div key={asset.id} style={{ background: '#2a2a2a', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                        <p><strong>{asset.name}</strong></p>
                        <audio src={asset.path} controls style={{ width: '100%' }} />
                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                            <input 
                                type="checkbox" 
                                id={`non-dialogue-asset-${asset.id}`} 
                                checked={setting.isNonDialogue} 
                                onChange={(e) => handleUpdateAssetSetting(asset.id, e.target.checked)}
                            />
                            <label htmlFor={`non-dialogue-asset-${asset.id}`} style={{ marginLeft: '8px' }}>Diyalog Metni Yok</label>
                        </div>
                        {setting.isNonDialogue && (
                          <div style={{ marginTop: '10px' }}>
                              <label style={{display: 'block', marginBottom: '5px'}}>Karakter:</label>
                              <Select
                                  options={characterOptions}
                                  value={relatedLine?.characterId ? characterOptions.find(c => c.value === relatedLine.characterId) : null}
                                  isClearable
                                  placeholder="Karakter seç..."
                                  onChange={(selectedOption) => {
                                      const newCharacterId = selectedOption ? selectedOption.value : null;

                                      if (relatedLine) {
                                          handleUpdateMappingLine(relatedLine.id, { characterId: newCharacterId });
                                      } else {
                                          if (newCharacterId === null) return;
                                          
                                          toast.loading("Diyalog dışı satır oluşturuluyor...");
                                          fetch(`/api/translation-lines`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                  sourceAssetId: asset.id,
                                                  key: `AUTO_NON_DIALOGUE_${asset.id}_${Date.now()}`,
                                                  originalVoiceReferenceAssetId: asset.id,
                                                  characterId: newCharacterId,
                                                  isNonDialogue: true,
                                                  originalText: null,
                                              }),
                                          }).then(res => res.json()).then(newLine => {
                                              toast.dismiss();
                                              if (!newLine.id) throw new Error(newLine.message || "Satır oluşturulamadı.");
                                              setMappingLines(prev => [...prev, newLine]);
                                              toast.success("Diyalog dışı satır oluşturuldu.");
                                          }).catch(error => { toast.dismiss(); toast.error(error.message); });
                                      }
                                  }}
                              />
                          </div>
                        )}
                      </div>
                    );
                })}
              </div>
            </div>

            <div>
              <h3>Çeviri Satırları ({mappingLines.length})</h3>
              <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #444', padding: '10px' }}>
                {mappingLines.filter(line => !line.isNonDialogue).map(line => (
                  <div key={line.id} style={{ background: '#2a2a2a', padding: '15px', borderRadius: '5px', marginBottom: '10px' }}>
                    <p><strong>Orijinal:</strong> "{line.originalText}"</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      <div>
                        <label>Orijinal Ses Asseti:</label>
                        <Select
                            options={audioAssetOptions}
                            value={line.originalVoiceReferenceAssetId ? audioAssetOptions.find(opt => opt.value === line.originalVoiceReferenceAssetId) : null}
                            onChange={(selected) => handleUpdateMappingLine(line.id, { originalVoiceReferenceAssetId: selected ? selected.value : null })}
                            isClearable
                        />
                      </div>
                      <div>
                        <label>Karakter:</label>
                        <Select
                            options={characterOptions}
                            value={line.characterId ? characterOptions.find(c => c.value === line.characterId) : null}
                            onChange={(selected) => handleUpdateMappingLine(line.id, { characterId: selected ? selected.value : null })}
                            isClearable
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}