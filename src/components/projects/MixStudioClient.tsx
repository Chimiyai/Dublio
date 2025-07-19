//src/components/projects/MixStudioClient.tsx
'use client';

import { useState, useMemo, FC } from 'react';
import { toast } from 'react-hot-toast';
import { LineForMixing } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/miksaj/page'; 
import { useAudioWaveform } from '@/lib/hooks/useAudioWaveform';
import { WaveformPlayer } from './WaveformPlayer'; // Bu bileşeni daha önce yazmıştınız

// === TİPLER ===
type Character = { id: number; name: string; profileImage: string | null };

// === TEK BİR MİKSAJ KARTI ===
const MixingCard = ({ line, onUploadComplete }: { line: LineForMixing, onUploadComplete: (lineId: number) => void }) => {
    const { waveform, progress, isPlaying, playPause, loadAudio, seekTo } = useAudioWaveform();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Ham kaydı yüklemek için
    const handleLoadRawAudio = () => {
        if (line.rawRecording?.url) {
            loadAudio(line.rawRecording.url);
        }
    };
    // YENİ: Dosya seçildiğinde state'i güncelleyen fonksiyon
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    // YENİ: Yüklemeyi gerçekleştiren ana fonksiyon
    const handleUploadAndComplete = async () => {
        if (!selectedFile) {
            toast.error("Lütfen önce bir dosya seçin.");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading("Nihai miksaj yükleniyor...");

        const formData = new FormData();
        formData.append('finalMixBlob', selectedFile);
        formData.append('lineId', line.id.toString());

        try {
            const response = await fetch('/api/mix-recordings', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Yükleme başarısız oldu.");
            }

            toast.success("Miksaj tamamlandı ve yüklendi!", { id: toastId });
            
            // Yükleme başarılı olduğunda ana bileşene haber veriyoruz.
            onUploadComplete(line.id);

        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ background: '#2a2a2a', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Kart Başlığı */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', color: '#aaa' }}>{line.key}</span>
                <span style={{ fontStyle: 'italic', color: 'orange' }}>Miksaj Bekliyor</span>
            </div>
            {line.isNonDialogue ? <p><i>[Diyalog Metni Yok]</i></p> : <blockquote>"{line.translatedText}"</blockquote>}

            {/* Ses Panelleri */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Orijinal Ses Paneli */}
                <div style={{ background: '#1c1c1c', padding: '10px', borderRadius: '4px' }}>
    <h4>Orijinal Referans Ses</h4>
    {line.originalVoiceReferenceAsset ? (
        <>
            <audio src={line.originalVoiceReferenceAsset.path} controls style={{ width: '100%' }}/>
            <a href={line.originalVoiceReferenceAsset.path} download>İndir</a>
        </>
    ) : <p>Referans yok.</p>}
</div>
                {/* Ham Türkçe Kayıt Paneli */}
                <div style={{ background: '#1c1c1c', padding: '10px', borderRadius: '4px' }}>
                    <h4>Ham Türkçe Kayıt ({line.rawRecording?.uploadedBy.username})</h4>
                    {line.rawRecording ? (
                        <>
                            <audio src={line.rawRecording.url} controls style={{ width: '100%' }}/>
                            <a href={line.rawRecording.url} download>İndir</a>
                            <button onClick={handleLoadRawAudio} style={{marginTop: '5px'}}>Waveform'da Göster</button>
                        </>
                    ) : <p>Ham kayıt yok.</p>}
                </div>
            </div>

            {/* Waveform Oynatıcı */}
            <div style={{minHeight: '100px'}}>
                {waveform.length > 0 ? (
                    <WaveformPlayer 
                        waveform={waveform} 
                        progress={progress} 
                        isPlaying={isPlaying} 
                        // DÜZELTME: Eksik prop burada eklendi.
                        onCanvasClick={(percentage) => seekTo(percentage * 100)} 
                    />
                ) : (
                    <p style={{textAlign: 'center', color: '#555'}}>Waveform'u görmek için bir sesi yükleyin.</p>
                )}
            </div>

            {/* Yükleme Alanı */}
            <div style={{ borderTop: '1px solid #444', paddingTop: '15px', textAlign: 'center' }}>
                <p>Nihai, miksajlanmış sesi buraya yükleyin:</p>
                <input 
                    type="file" 
                    accept="audio/*" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
                <button 
                    onClick={handleUploadAndComplete}
                    disabled={!selectedFile || isUploading}
                    style={{ marginLeft: '10px' }}
                >
                    {isUploading ? 'Yükleniyor...' : 'Yükle ve Tamamla'}
                </button>
            </div>
        </div>
    );
}

// === ANA MİKSAJ STÜDYOSU COMPONENT'İ ===
export default function MixStudioClient({ initialLines }: { initialLines: LineForMixing[] }) {
    const [lines, setLines] = useState(initialLines);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

    const allCharacters = useMemo(() => {
        const charMap = new Map<number, Character>();
        lines.forEach(line => {
            if (line.character) charMap.set(line.character.id, line.character);
        });
        return Array.from(charMap.values());
    }, [lines]);

    const linesForSelectedChar = useMemo(() => {
        if (!selectedCharacter) return [];
        return lines.filter(line => line.character?.id === selectedCharacter.id);
    }, [lines, selectedCharacter]);

    // YENİ: Yükleme başarılı olduğunda çağrılacak fonksiyon
    const handleUploadComplete = (completedLineId: number) => {
        // Tamamlanan satırı state'ten filtreleyerek arayüzden anında kaldır
        setLines(prevLines => prevLines.filter(line => line.id !== completedLineId));
        toast.success("Liste güncellendi!");
    };

    if (!allCharacters.length) {
        return <p>Miksaj için bekleyen bir ses kaydı bulunmuyor.</p>;
    }
    
    // Karakter seçme ekranı
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

    // Seçili karakterin kartları
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>İşlenen Karakter: <strong>{selectedCharacter.name}</strong></h3>
                <button onClick={() => setSelectedCharacter(null)} style={{ background: '#555' }}>Karakter Listesine Dön</button>
            </div>
            <div style={{ display: 'grid', gap: '20px' }}>
                {linesForSelectedChar.length > 0 ? 
                    linesForSelectedChar.map(line => (
                        <MixingCard 
                            key={line.id} 
                            line={line} 
                            // DÜZENLEME: Yeni prop'u MixingCard'a aktarıyoruz
                            onUploadComplete={handleUploadComplete} 
                        />
                    )) : 
                    <p>Bu karakter için miksaj bekleyen kayıt yok.</p>
                }
            </div>
        </div>
    );
}