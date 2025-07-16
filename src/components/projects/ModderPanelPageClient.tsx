//src/components/projects/ModderPanelPageClient.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Character, User, Project, TeamMember, TranslationLine, Asset } from '@prisma/client';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { type OptionsOrGroups } from 'react-select';

// page.tsx'ten gelen tipleri import ediyoruz
import { CharacterWithVoiceActors, AssetForModder, TranslationLineForModder } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page';

type VoiceActorUser = Pick<User, 'id' | 'username' | 'profileImage'>;

interface SelectOption { value: number; label: string; }
type TeamMemberWithUser = TeamMember & { user: VoiceActorUser };


interface Props {
  initialCharacters: CharacterWithVoiceActors[];
  allTeamMembers: TeamMemberWithUser[];
  projectId: number;
  viewerRole: string;
  allAudioAssets: AssetForModder[]; // YENİ PROP
  allTranslationLines: TranslationLineForModder[]; // YENİ PROP
}

export default function ModderPanelPageClient({ 
  initialCharacters, 
  allTeamMembers, 
  projectId, 
  viewerRole, 
  allAudioAssets, // Yeni prop'lar
  allTranslationLines 
}: Props) {
  const [characters, setCharacters] = useState<CharacterWithVoiceActors[]>(initialCharacters);
  const [activeTab, setActiveTab] = useState<'characters' | 'mapping'>('characters'); // Yeni state

  // Karakter oluşturma form state'leri (aynı)
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharImage, setNewCharImage] = useState('');
  const [isCreatingChar, setIsCreatingChar] = useState(false);

  // Ses/Metin Eşleştirme state'leri
  const [mappingLines, setMappingLines] = useState<TranslationLineForModder[]>(allTranslationLines);


  const voiceActorOptions: SelectOption[] = allTeamMembers.map(member => ({
    value: member.user.id,
    label: member.user.username,
  }));

  const handleCreateCharacter = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) {
      toast.error("Karakter adı boş olamaz.");
      return;
    }

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
      if (!res.ok) {
        throw new Error(newChar.message || "Karakter oluşturulamadı.");
      }

      toast.success("Karakter başarıyla eklendi!");
      // Yeni karakteri listeye ekle
      setCharacters(prev => [...prev, newChar]);
      // Formu temizle
      setNewCharName('');
      setNewCharDesc('');
      setNewCharImage('');

    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsCreatingChar(false);
    }
  };

  // Seslendirmenleri güncelleme fonksiyonu (aynı)
  const handleUpdateVoiceActors = async (characterId: number, selectedOptions: any[]) => {
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

      setCharacters(prev => prev.map(char => 
        char.id === characterId ? updatedCharacter : char
      ));
      toast.success("Seslendirmenler güncellendi!");
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleUpdateMappingLine = async (lineId: number, updateData: { characterId?: number | null, originalVoiceAssetId?: number | null }) => {
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

return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1>Modder Paneli</h1>
      <p>Proje karakterlerini ve seslendirme atamalarını buradan yönetin.</p>

      {/* SEKME NAVİGASYONU */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #444', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('characters')} style={{ padding: '10px 15px', background: activeTab === 'characters' ? 'purple' : '#333', color: 'white', border: 'none', cursor: 'pointer' }}>
          Karakter Yönetimi
        </button>
        <button onClick={() => setActiveTab('mapping')} style={{ padding: '10px 15px', background: activeTab === 'mapping' ? 'purple' : '#333', color: 'white', border: 'none', cursor: 'pointer' }}>
          Ses/Metin Eşleştirme
        </button>
      </div>

      {/* SEKME İÇERİKLERİ */}
      {activeTab === 'characters' && (
        <>
          <hr style={{ margin: '30px 0' }} />
          <h2>Yeni Karakter Ekle</h2>
          <form onSubmit={handleCreateCharacter} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
            <div>
          <label htmlFor="charName" style={{display: 'block', marginBottom: '5px'}}>Karakter Adı</label>
          <input 
            id="charName"
            type="text" 
            value={newCharName} 
            onChange={e => setNewCharName(e.target.value)} 
            placeholder="Karakter Adı (örn: V, Geralt)" 
            required 
            style={{width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white'}}
          />
        </div>
        <div>
          <label htmlFor="charDesc" style={{display: 'block', marginBottom: '5px'}}>Açıklama</label>
          <textarea 
            id="charDesc"
            value={newCharDesc} 
            onChange={e => setNewCharDesc(e.target.value)} 
            placeholder="Açıklama (opsiyonel)" 
            rows={3} 
            style={{width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white'}}
          />
        </div>
        <div>
          <label htmlFor="charImage" style={{display: 'block', marginBottom: '5px'}}>Profil Resmi URL'si</label>
          <input 
            id="charImage"
            type="text" 
            value={newCharImage} 
            onChange={e => setNewCharImage(e.target.value)} 
            placeholder="Profil Resmi URL'si (opsiyonel)" 
            style={{width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white'}}
          />
        </div>
        <button type="submit" disabled={isCreatingChar} style={{ background: isCreatingChar ? '#555' : 'purple', padding: '10px', color: 'white', border: 'none', cursor: 'pointer' }}>
          {isCreatingChar ? 'Oluşturuluyor...' : 'Karakter Oluştur'}
        </button>
          </form>

          <hr style={{ margin: '30px 0' }} />
          <h2>Karakter Listesi ({characters.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {characters.map(char => (
              <div key={char.id} style={{ background: '#1c1c1c', padding: '15px', borderRadius: '8px' }}>
                <img src={char.profileImage || `https://ui-avatars.com/api/?name=${char.name}`} alt={char.name} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '10px' }} />
                <h3>{char.name}</h3>
                <p style={{ fontSize: '0.9rem', color: '#aaa' }}>{char.description || 'Açıklama yok.'}</p>
                <div style={{ marginTop: '15px' }}>
                  <p><strong>Seslendirmenler:</strong></p>
                  <Select
                    isMulti
                    options={voiceActorOptions}
                    value={char.voiceActors.map(va => ({ value: va.voiceActor.id, label: va.voiceActor.username }))}
                    onChange={(selected) => handleUpdateVoiceActors(char.id, selected as SelectOption[])}
                    styles={{
                    control: (base) => ({ ...base, backgroundColor: '#333', borderColor: '#555', color: 'white' }),
                    menu: (base) => ({ ...base, backgroundColor: '#333', color: 'white' }),
                    multiValue: (base) => ({ ...base, backgroundColor: 'purple', color: 'white' }),
                    multiValueLabel: (base) => ({ ...base, color: 'white' }),
                    multiValueRemove: (base) => ({ ...base, ':hover': { backgroundColor: '#a00' } }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#555' : '#333',
                        color: 'white',
                    }),
                    singleValue: (base) => ({ ...base, color: 'white' }),
                    input: (base) => ({ ...base, color: 'white' }),
                }}
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
          <p style={{ color: '#aaa' }}>Orijinal ses assetlerini çeviri metin satırlarına ve karakterlere atayın.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
            {/* SOL TARAF: Orijinal Ses Asset'leri Listesi */}
            <div>
              <h3>Orijinal Ses Assetleri ({allAudioAssets.length})</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #444', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allAudioAssets.length > 0 ? allAudioAssets.map(asset => (
                  <div key={asset.id} style={{ background: '#2a2a2a', padding: '10px', borderRadius: '5px' }}>
                    <p>{asset.name}</p>
                    <audio src={asset.path} controls style={{ width: '100%' }} />
                  </div>
                )) : <p>Bu projeye yüklenmiş ses asseti bulunmuyor.</p>}
              </div>
            </div>

            {/* SAĞ TARAF: Çeviri Satırları ve Atama Formları */}
            <div>
              <h3>Çeviri Satırları ({mappingLines.length})</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #444', padding: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {mappingLines.length > 0 ? mappingLines.map(line => (
                  <div key={line.id} style={{ background: '#2a2a2a', padding: '15px', borderRadius: '5px' }}>
                    <p style={{ fontFamily: 'monospace', color: '#aaa', margin: '0 0 5px' }}>{line.key}</p>
                    <p style={{ margin: '0 0 10px' }}>Orijinal: <strong>"{line.originalText}"</strong></p>
                    {line.translatedText && <p style={{ margin: '0 0 10px' }}>Çeviri: "{line.translatedText}"</p>}

                    {/* Atama Formları */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      {/* Orijinal Ses Atama */}
                      <div>
                        <label style={{display: 'block', marginBottom: '5px'}}>Orijinal Ses Asseti:</label>
                        <Select
                            options={allAudioAssets.map(asset => ({ value: asset.id, label: asset.name }))}
                            value={line.originalVoiceAssetId ? { value: line.originalVoiceAssetId, label: allAudioAssets.find(a => a.id === line.originalVoiceAssetId)?.name || 'Yükleniyor...' } : null}
                            onChange={(selected) => handleUpdateMappingLine(line.id, { originalVoiceAssetId: selected ? selected.value : null })}
                            isClearable
                            placeholder="Ses asseti seç..."
                            styles={{ 
                              control: (base) => ({ ...base, backgroundColor: '#333', borderColor: '#555', color: 'white' }),
                              menu: (base) => ({ ...base, backgroundColor: '#333', color: 'white' }),
                              option: (base, state) => ({
                                  ...base,
                                  backgroundColor: state.isFocused ? '#555' : '#333',
                                  color: 'white',
                              }),
                              singleValue: (base) => ({ ...base, color: 'white' }),
                              input: (base) => ({ ...base, color: 'white' }),
                             }}
                        />
                      </div>
                      
                      {/* Karakter Atama */}
                      <div>
                        <label style={{display: 'block', marginBottom: '5px'}}>Karakter:</label>
                        <Select
                            options={characters.map(char => ({ value: char.id, label: char.name }))}
                            value={line.characterId ? { value: line.characterId, label: characters.find(c => c.id === line.characterId)?.name || 'Yükleniyor...' } : null}
                            onChange={(selected) => handleUpdateMappingLine(line.id, { characterId: selected ? selected.value : null })}
                            isClearable
                            placeholder="Karakter seç..."
                            styles={{
                                control: (base) => ({ ...base, backgroundColor: '#333', borderColor: '#555', color: 'white' }),
                                menu: (base) => ({ ...base, backgroundColor: '#333', color: 'white' }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? '#555' : '#333',
                                    color: 'white',
                                }),
                                singleValue: (base) => ({ ...base, color: 'white' }),
                                input: (base) => ({ ...base, color: 'white' }),
                            }}
                        />
                      </div>
                    </div>
                  </div>
                )) : <p>Bu projede işlenmiş çeviri satırı bulunmuyor.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}