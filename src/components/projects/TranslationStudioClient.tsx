// src/components/projects/TranslationStudioClient.tsx
'use client';

// HATA 1 DÜZELTMESİ: useCallback buraya eklendi.
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { TranslationStatus } from '@prisma/client';
import { PlayCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { LineForStudio } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/ceviri/page';
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import CommentModal from './CommentModal';

// Karakter seçimi için bir tip
type Character = { id: number; name: string; profileImage: string | null };

// LineForStudioWithComments tipi
type LineForStudioWithComments = LineForStudio & { commentCount: number };


// ===================================================================
// === YENİ BÖLÜM 1.1: Tek Bir Çeviri Kartı Component'i ===
// ===================================================================
const TranslationLineCard = ({ line, onSave, onOpenComments }: { line: LineForStudioWithComments, onSave: (updatedLine: LineForStudioWithComments) => void, onOpenComments: (line: LineForStudioWithComments) => void }) => {
    const [translation, setTranslation] = useState(line.translatedText || '');
    const [isSaving, setIsSaving] = useState(false);
    
    const statusColors: { [key: string]: string } = { NOT_TRANSLATED: '#ef4444', TRANSLATED: '#f97316', REVIEWED: '#facc15', APPROVED: '#22c55e' };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/translation-lines/${line.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ translatedText: translation })
            });
            if(!res.ok) throw new Error("Kaydedilemedi");
            const updatedLine: LineForStudioWithComments = await res.json();
            
            // Yorum sayısını korumak için eski sayı ile birleştir
            const finalUpdatedLine = { ...updatedLine, commentCount: line.commentCount };
            
            toast.success("Kaydedildi!");
            onSave(finalUpdatedLine); // Değişikliği ana state'e bildir
        } catch (error) {
            toast.error("Kaydederken hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const hasChanged = translation !== (line.translatedText || '');

    return (
        <div style={{ background: '#2a2a2a', borderRadius: '8px', borderLeft: `4px solid ${statusColors[line.status]}`, padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Kartın Üst Kısmı: Anahtar ve Durum */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.9em', color: '#a1a1aa' }}>{line.key}</span>
                <span style={{ fontSize: '0.8em', background: statusColors[line.status], color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                    {line.status.replace('_', ' ')}
                </span>
            </div>
            {/* Metinler */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                    <label style={{ fontSize: '0.8em', color: '#a1a1aa' }}>ORİJİNAL METİN</label>
                    <p style={{ margin: '4px 0 0 0', background: '#1c1c1c', padding: '8px', borderRadius: '4px', minHeight: '40px' }}>{line.originalText}</p>
                </div>
                <div>
                    <label style={{ fontSize: '0.8em', color: '#a1a1aa' }}>ÇEVİRİ</label>
                    <textarea value={translation} onChange={e => setTranslation(e.target.value)} rows={2} style={{ width: '100%', background: '#333', color: 'white', border: '1px solid #555', padding: '8px', borderRadius: '4px', resize: 'vertical' }} />
                </div>
            </div>
            {/* İşlemler */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => onOpenComments(line)} title="Yorumlar" style={{ position: 'relative', background: 'transparent', border: '1px solid #555' }}>
                    <ChatBubbleBottomCenterTextIcon style={{width: 20}} />
                    {line.commentCount > 0 && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {line.commentCount}
                        </span>
                    )}
                </button>
                <button onClick={handleSave} disabled={isSaving || !hasChanged} style={{ minWidth: '100px' }}>
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
};

// ===================================================================
// === YENİ BÖLÜM 1.2: Arayüz Sekmesinin Ana Kapsayıcısı ===
// ===================================================================
const UiTextTabContainer = ({ initialLines, onOpenComments }: { initialLines: LineForStudioWithComments[], onOpenComments: (line: LineForStudioWithComments) => void }) => {
    const [lines, setLines] = useState(initialLines);
    const [activeStatus, setActiveStatus] = useState<TranslationStatus | 'ALL'>('ALL');
    const [visibleCount, setVisibleCount] = useState(20); // Başlangıçta 20 kart göster

    const statusFilters: (TranslationStatus | 'ALL')[] = ['ALL', 'NOT_TRANSLATED', 'TRANSLATED', 'REVIEWED', 'APPROVED'];

    const filteredLines = useMemo(() => {
        if (activeStatus === 'ALL') return lines;
        return lines.filter(line => line.status === activeStatus);
    }, [lines, activeStatus]);

    const linesToDisplay = useMemo(() => {
        return filteredLines.slice(0, visibleCount);
    }, [filteredLines, visibleCount]);

    const handleLineUpdate = (updatedLine: LineForStudioWithComments) => {
        setLines(prevLines => prevLines.map(l => l.id === updatedLine.id ? updatedLine : l));
    };

    return (
        <div>
            {/* Filtreleme Sekmeleri */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {statusFilters.map(status => (
                    <button 
                        key={status}
                        onClick={() => setActiveStatus(status)}
                        style={{ background: activeStatus === status ? 'purple' : '#3f3f46', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '16px', cursor: 'pointer' }}
                    >
                        {status.replace('_', ' ')} ({status === 'ALL' ? lines.length : lines.filter(l => l.status === status).length})
                    </button>
                ))}
            </div>

            {/* Çeviri Kartları */}
            <div style={{ display: 'grid', gap: '15px' }}>
                {linesToDisplay.map(line => (
                    <TranslationLineCard 
                        key={line.id} 
                        line={line}
                        onSave={handleLineUpdate}
                        onOpenComments={onOpenComments} 
                    />
                ))}
            </div>

            {/* "Daha Fazla Yükle" Butonu */}
            {visibleCount < filteredLines.length && (
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button onClick={() => setVisibleCount(prev => prev + 20)} style={{ padding: '10px 30px', fontSize: '1rem' }}>
                        Daha Fazla Yükle ({filteredLines.length - visibleCount} tane daha)
                    </button>
                </div>
            )}
            
            {linesToDisplay.length === 0 && (
                <p style={{ textAlign: 'center', color: '#a1a1aa', marginTop: '40px' }}>
                    Bu filtrede gösterilecek satır bulunmuyor.
                </p>
            )}
        </div>
    );
};
// ===================================================================
// === YENİ BÖLÜM: Diyaloglar Sekmesi İçin Component'ler ===
// ===================================================================

const CharacterLinesTable = ({ lines, onOpenComments, onUndo }: { lines: LineForStudioWithComments[], onOpenComments: (line: LineForStudioWithComments) => void, onUndo: (lineId: number) => void }) => {
    const statusColors: { [key: string]: string } = { NOT_TRANSLATED: 'red', TRANSLATED: 'orange', REVIEWED: 'yellow', APPROVED: 'green' };
    if (lines.length === 0) return <p>Bu karakter için listelenecek diyalog bulunmuyor.</p>;
    return (
        <div style={{marginTop: '40px'}}>
            <h4>Karakterin Tüm Diyalogları</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead><tr style={{ background: '#1c1c1c' }}>
                    <th style={{ padding: '10px', border: '1px solid #444' }}>Durum</th>
                    <th style={{ padding: '10px', border: '1px solid #444' }}>Anahtar</th>
                    <th style={{ padding: '10px', border: '1px solid #444' }}>Orijinal Metin</th>
                    <th style={{ padding: '10px', border: '1px solid #444' }}>Çevrilen Metin</th>
                    <th style={{ padding: '10px', border: '1px solid #444' }}>İşlemler</th>
                </tr></thead>
                <tbody>{lines.map(line => (
                    <tr key={line.id} style={{ background: '#2a2a2a' }}>
                        <td style={{ padding: '8px', border: '1px solid #444' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColors[line.status] }} title={line.status}></div></td>
                        <td style={{ padding: '8px', border: '1px solid #444', fontFamily: 'monospace' }}>{line.key}</td>
                        <td style={{ padding: '8px', border: '1px solid #444' }}>{line.originalText}</td>
                        <td style={{ padding: '8px', border: '1px solid #444' }}>{line.translatedText || '...'}</td>
                        <td style={{ padding: '8px', border: '1px solid #444', display: 'flex', gap: '5px' }}>
    {/* Yorumlar butonu aynı kalıyor */}
    <button onClick={() => onOpenComments(line)} title="Yorumlar" style={{ position: 'relative' }}>
    <ChatBubbleBottomCenterTextIcon style={{width: 20}} />
    {/* YENİ: Bildirim Balonu */}
    {line.commentCount > 0 && (
        <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: 'red', color: 'white',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '11px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
            {line.commentCount}
        </span>
    )}
</button>
    
    {/* YENİ: Geri Al butonu (sadece çevrilmişse görünür) */}
    {line.status !== 'NOT_TRANSLATED' && (
        <button onClick={() => onUndo(line.id)} title="Çeviriyi Geri Al" style={{background: 'darkred'}}>Geri Al</button>
    )}
</td>
                    </tr>
                ))}</tbody>
            </table>
        </div>
    );
};

const DialogueTabContent = ({ allDialogueLines, onOpenComments }: { allDialogueLines: LineForStudioWithComments[], onOpenComments: (line: LineForStudioWithComments) => void }) => {
    const [lines, setLines] = useState<LineForStudioWithComments[]>(allDialogueLines);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

    const allCharacters = useMemo(() => {
        const charMap = new Map<number, Character>();
        lines.forEach(line => { if (line.character) charMap.set(line.character.id, line.character); });
        return Array.from(charMap.values());
    }, [lines]);

    const handleSaveFromZenMode = async (line: LineForStudioWithComments, translation: string) => {
        try {
            const res = await fetch(`/api/translation-lines/${line.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ translatedText: translation })
            });
            if(!res.ok) throw new Error("Kaydedilemedi");
            const updatedLine: LineForStudioWithComments = await res.json();
            setLines(prevLines => prevLines.map(l => l.id === updatedLine.id ? updatedLine : l));
            toast.success("Kaydedildi!", { duration: 1000 });
        } catch (error) {
            toast.error("Kaydederken hata oluştu.");
            throw error; 
        }
    };
    const handleUndoTranslation = async (lineId: number) => {
    const originalLine = lines.find(l => l.id === lineId);
    if (!originalLine) return;

    if (!confirm(`"${originalLine.key}" anahtarlı çeviriyi geri almak istediğinizden emin misiniz?`)) {
        return;
    }

    const toastId = toast.loading("Çeviri geri alınıyor...");
    try {
        const res = await fetch(`/api/translation-lines/${lineId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ translatedText: "" }) // Çeviriyi boşaltıyoruz
        });
        if (!res.ok) throw new Error("Geri alınamadı.");
        
        const updatedLine: LineForStudioWithComments = await res.json();
        // State'i anında güncelle
        setLines(prevLines => prevLines.map(l => l.id === updatedLine.id ? updatedLine : l));
        
        toast.success("Çeviri geri alındı.", { id: toastId });
    } catch (error) {
        toast.error("Geri alma işlemi başarısız oldu.", { id: toastId });
    }
};
    
    if (!selectedCharacter) {
        return (
          <div style={{ padding: '20px' }}>
            <h2>Çalışmak için bir karakter seçin</h2>
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

    const linesForSelectedChar = lines
    .filter(line => line.characterId === selectedCharacter.id)
    .sort((a, b) => a.key.localeCompare(b.key)); // A-Z SIRALAMA

const linesForZenMode = linesForSelectedChar
    .filter(line => line.status === TranslationStatus.NOT_TRANSLATED);
    // Not: Zaten sıralanmış bir listeden filtrelediğimiz için burayı tekrar sıralamaya gerek yok.

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Çevrilen Karakter: <strong>{selectedCharacter.name}</strong></h3>
                <button onClick={() => setSelectedCharacter(null)} style={{ background: '#555' }}>Karakter Değiştir</button>
            </div>
            <DialogueZenMode lines={linesForZenMode} character={selectedCharacter} onSaveAndNext={handleSaveFromZenMode} />
            <CharacterLinesTable lines={linesForSelectedChar} onOpenComments={onOpenComments} onUndo={handleUndoTranslation} />
        </div>
    );
};

// ===================================================================
// === BÖLÜM 2: Diyaloglar Sekmesi İçin "Zen Modu" Component'i ===
// ===================================================================
const DialogueZenMode = ({ lines, character, onSaveAndNext }: { lines: LineForStudioWithComments[], character: Character, onSaveAndNext: (line: LineForStudioWithComments, translation: string) => Promise<void> }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  const currentLine = lines[currentIndex];

  const goToNextLine = useCallback(() => {
    if (currentIndex < lines.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, lines.length]);
  
  const handleSaveAndNext = async () => {
    if (isSaving || !currentLine) return;
    setIsSaving(true);
    await onSaveAndNext(currentLine, currentTranslation);
    setIsSaving(false);
    goToNextLine();
  };
  
  const playAudio = () => {
    if (currentLine?.originalVoiceReferenceAsset?.path) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      const newAudio = new Audio(currentLine.originalVoiceReferenceAsset.path);
      audioRef.current = newAudio; newAudio.play();
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement === inputRef.current) { e.preventDefault(); handleSaveAndNext(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveAndNext]);

  useEffect(() => {
    if (currentLine) { setCurrentTranslation(''); inputRef.current?.focus(); }
  }, [currentLine]);

  if (lines.length === 0) {
    return (
        <div style={{padding: '20px', background: '#2e7d32', color: 'white', borderRadius: '8px'}}>
            Tebrikler! <strong>{character.name}</strong> için çevrilmesi gereken yeni diyalog kalmadı.
        </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', background: '#2a2a2a', borderRadius: '8px' }}>
      <p style={{textAlign: 'right', marginTop: '5px', marginBottom: '20px', fontSize: '0.9em', color: '#aaa'}}>Kalan Satır: {lines.length - currentIndex}</p>
      {currentLine ? (
        <div> {/* Bir kapsayıcı div ekledik */}
    <div style={{ marginBottom: '15px' }}>
        {/* YENİ: Anahtar bilgisi eklendi */}
        <div style={{ marginBottom: '5px', fontSize: '0.8em', color: '#aaa', fontFamily: 'monospace'}}>
            ANAHTAR: {currentLine.key}
        </div>
        <label>Orijinal Metin:</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#1c1c1c', padding: '15px', borderRadius: '4px', fontSize: '1.2rem' }}>
              {currentLine.originalVoiceReferenceAsset?.path && (
                <button onClick={playAudio} title="Orijinal Sesi Dinle" style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0}}><PlayCircleIcon style={{ width: '32px', height: '32px' }} /></button>
              )}
              <span>{currentLine.originalText}</span>
            </div>
          </div>
          <div>
            <label>Çeviri:</label>
            <input ref={inputRef} type="text" value={currentTranslation} onChange={e => setCurrentTranslation(e.target.value)} placeholder="Çeviriyi buraya yazın ve Enter'a basın..." style={{ width: '100%', background: '#333', border: '1px solid #555', color: 'white', padding: '15px', fontSize: '1.2rem', borderRadius: '4px' }}/>
          </div>
          <div style={{textAlign: 'right', marginTop: '20px'}}>
             <button onClick={handleSaveAndNext} disabled={isSaving}>{isSaving ? <ArrowPathIcon style={{width: 20, height: 20, animation: 'spin 1s linear infinite'}}/> : 'Kaydet ve Sonraki'}</button>
          </div>
        </div>
      ) : ( <p>Bu karakter için çevrilecek satır bulunmuyor veya hepsi tamamlandı.</p> )}
    </div>
  );
};



// ===================================================================
// === BÖLÜM 3: Ana Kapsayıcı Component ===
// ===================================================================
interface Props {
  initialDialogueLines: LineForStudioWithComments[];
  initialUiLines: LineForStudioWithComments[];
}

export default function TranslationStudioClient({ initialDialogueLines, initialUiLines }: Props) {
  const [activeTab, setActiveTab] = useState<'dialogue' | 'ui'>('dialogue');
  const [commentingLine, setCommentingLine] = useState<LineForStudioWithComments | null>(null);

  const handleOpenComments = (line: LineForStudioWithComments) => { setCommentingLine(line); };
  const handleCloseComments = () => { setCommentingLine(null); };

  return (
    <div>
      <div style={{ margin: '20px 0', gap: '1px', background: '#1c1c1c', display: 'inline-flex', borderRadius: '8px', overflow: 'hidden' }}>
        <button onClick={() => setActiveTab('dialogue')} style={{ background: activeTab === 'dialogue' ? 'purple' : '#2a2a2a', border: 'none', color: 'white', padding: '10px 20px', cursor: 'pointer' }}>
          Diyaloglar ({initialDialogueLines.length})
        </button>
        <button onClick={() => setActiveTab('ui')} style={{ background: activeTab === 'ui' ? 'purple' : '#2a2a2a', border: 'none', color: 'white', padding: '10px 20px', cursor: 'pointer' }}>
          Arayüz & Metinler ({initialUiLines.length})
        </button>
      </div>

      <div>
    {activeTab === 'dialogue' ? (
      <DialogueTabContent 
        allDialogueLines={initialDialogueLines} 
        onOpenComments={handleOpenComments} 
      />
    ) : (
      // DÜZENLEME: Yeni container component'imizi burada kullanıyoruz.
      <UiTextTabContainer 
        initialLines={initialUiLines} 
        onOpenComments={handleOpenComments} 
      />
    )}
</div>

      {commentingLine && (
        <CommentModal 
            lineId={commentingLine.id}
            lineKey={commentingLine.key}
            onClose={handleCloseComments}
        />
      )}
    </div>
  );
}