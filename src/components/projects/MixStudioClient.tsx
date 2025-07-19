//src/components/projects/MixStudioClient.tsx
'use client';

import { useState, useMemo, FC } from 'react';
import { toast } from 'react-hot-toast';
import { LineForMixing } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/miksaj/page'; 
import { VoiceRecordingStatus } from '@prisma/client';
import { AudioPanel } from './AudioPanel';

// === TİPLER ===
type Character = { id: number; name: string; profileImage: string | null };
type MixStudioTab = 'PENDING_MIX' | 'COMPLETED' | 'ALL';
// YENİ: API'den dönen ve anlık ses verisini de içeren tip
type UpdatedLineData = LineForMixing & { newDataUri?: string };

// === TEK BİR MİKSAJ KARTI ===
const MixingCard = ({ line, onMixComplete, onUndo }: { line: UpdatedLineData, onMixComplete: (lineId: number, updatedData: UpdatedLineData) => void, onUndo: (lineId: number) => void }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleUpload = async () => {
    if (!selectedFile) return toast.error("Lütfen bir dosya seçin.");
    setIsUploading(true);
    const toastId = toast.loading("Nihai miksaj yükleniyor...");

    const formData = new FormData();
    formData.append('finalMixBlob', selectedFile);
    formData.append('lineId', line.id.toString());

    try {
        const response = await fetch('/api/mix-recordings', { method: 'POST', body: formData });
        const result = await response.json(); // Tip atamasını kaldırıyoruz

        if (!response.ok) {
            // Hata durumunda, result objesinin 'message' alanı olabilir.
            throw new Error(result.message || "Yükleme başarısız oldu.");
        }
        
        // Başarılı durumda, result'ın beklediğimiz tipte olduğunu varsayabiliriz.
        toast.success("Miksaj tamamlandı!", { id: toastId });
        onMixComplete(line.id, result as UpdatedLineData); // Burada tip ataması yapmak daha güvenli.

    } catch (error: any) {
        toast.error(error.message, { id: toastId });
    } finally {
        setIsUploading(false);
    }
};
    
    return (
        <div style={{ background: '#2a2a2a', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', color: '#aaa' }}>{line.key}</span>
                <span style={{ fontStyle: 'italic', color: line.recordingStatus === 'COMPLETED' ? 'lightgreen' : 'orange' }}>
                    {line.recordingStatus === 'COMPLETED' ? 'Tamamlandı' : 'Miksaj Bekliyor'}
                </span>
            </div>
            {line.isNonDialogue ? <p><i>[Diyalog Metni Yok]</i></p> : <blockquote>"{line.translatedText}"</blockquote>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <AudioPanel title="Orijinal Referans" url={line.originalVoiceReferenceAsset?.path} />
                <AudioPanel title={`Ham Kayıt (${line.rawRecording?.uploadedBy.username})`} url={line.rawRecording?.url} />
            </div>

            <div style={{ borderTop: '1px solid #444', paddingTop: '15px' }}>
                {line.recordingStatus === 'PENDING_MIX' ? (
                    <div style={{textAlign: 'center'}}>
                        <p>Nihai, miksajlanmış sesi buraya yükleyin:</p>
                        <input type="file" accept="audio/*" onChange={handleFileChange} disabled={isUploading} />
                        <button onClick={handleUpload} disabled={!selectedFile || isUploading} style={{marginLeft: '10px'}}>
                            {isUploading ? 'Yükleniyor...' : 'Yükle ve Tamamla'}
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* DÜZELTME: Artık geçici çözüme gerek yok, hook her şeyi hallediyor. */}
                        <AudioPanel title="Nihai Miksaj" url={line.voiceRecordingUrl} />
                        <div style={{textAlign: 'center', marginTop: '10px'}}>
                            <button onClick={() => onUndo(line.id)} style={{background: '#b91c1c'}}>Miksajı Geri Al</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// === ANA MİKSAJ STÜDYOSU COMPONENT'İ ===
export default function MixStudioClient({ initialLines }: { initialLines: LineForMixing[] }) {
    const [lines, setLines] = useState<UpdatedLineData[]>(initialLines);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [activeTab, setActiveTab] = useState<MixStudioTab>('PENDING_MIX');

    const allCharacters = useMemo(() => {
        const charMap = new Map<number, Character>();
        lines.forEach(line => {
            if (line.character) charMap.set(line.character.id, line.character);
        });
        return Array.from(charMap.values());
    }, [lines]);

    const filteredLines = useMemo(() => {
        let characterFiltered = selectedCharacter ? lines.filter(l => l.character?.id === selectedCharacter.id) : lines;
        if (activeTab === 'ALL') return characterFiltered;
        return characterFiltered.filter(l => l.recordingStatus === activeTab);
    }, [lines, selectedCharacter, activeTab]);
    
    const handleMixComplete = (lineId: number, updatedData: UpdatedLineData) => {
        setLines(prev => prev.map(l => l.id === lineId ? updatedData : l));
    };

    const handleUndo = async (lineId: number) => {
        if (!confirm("Bu miksajı geri almak istediğinizden emin misiniz?")) return;
        
        const toastId = toast.loading("Miksaj geri alınıyor...");
        try {
            const res = await fetch(`/api/mix-recordings/${lineId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Geri alma başarısız.");
            const revertedLine = await res.json();
            
            setLines(prev => prev.map(l => l.id === lineId ? { ...l, ...revertedLine } : l));
            toast.success("Miksaj geri alındı.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };
    
    if (!allCharacters.length) {
        return <p>Miksaj için bekleyen bir ses kaydı bulunmuyor.</p>;
    }

    if (!selectedCharacter) {
        return (
          <div style={{ padding: '20px' }}>
            <h2>İşlem yapmak için bir karakter seçin</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
              {allCharacters.map(char => (
                <div key={char.id} onClick={() => setSelectedCharacter(char)} style={{ cursor: 'pointer', textAlign: 'center', padding: '10px', borderRadius: '8px' }}>
                  <img src={char.profileImage || '/images/default-avatar.png'} alt={char.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                  <p style={{marginTop: '10px'}}>{char.name}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>İşlenen Karakter: <strong>{selectedCharacter.name}</strong></h3>
                <button onClick={() => setSelectedCharacter(null)} style={{ background: '#555' }}>Karakter Listesine Dön</button>
            </div>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
                <button onClick={() => setActiveTab('PENDING_MIX')} style={{background: activeTab === 'PENDING_MIX' ? 'purple' : '#3f3f46'}}>Miksaj Bekliyor</button>
                <button onClick={() => setActiveTab('COMPLETED')} style={{background: activeTab === 'COMPLETED' ? 'purple' : '#3f3f46'}}>Tamamlanan</button>
                <button onClick={() => setActiveTab('ALL')} style={{background: activeTab === 'ALL' ? 'purple' : '#3f3f46'}}>Tümü</button>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {filteredLines.length > 0 ? 
                    filteredLines.map(line => (
                        <MixingCard 
                            key={line.id} 
                            line={line}
                            onMixComplete={handleMixComplete}
                            onUndo={handleUndo}
                        />
                    )) : 
                    <p>Bu filtrede gösterilecek kayıt yok.</p>
                }
            </div>
        </div>
    );
}