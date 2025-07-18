//src/components/projects/TriageTab.tsx
'use client';

// Adım 1: React ve diğer temel hook'ları import ediyoruz.
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Prisma, Asset, AssetClassification, TranslationLine, Character } from '@prisma/client';
import Select from 'react-select';
import { WaveformPlayer } from './WaveformPlayer'; 
import { useAudioWaveform } from '@/lib/hooks/useAudioWaveform';

// API'den gelen yeni, zenginleştirilmiş Asset tipini tanımlıyoruz
type CompletedAsset = Asset & {
  referencedTranslationLines: {
    originalText: string | null;
    character: {
      name: string;
    } | null;
  }[];
};

// === TİPLER (Aynı kalıyor) ===
type TriageStatus = 'CLASSIFYING' | 'LINKING';
interface CharacterOption { value: number; label: string; }
interface TriageProps {
  projectId: number;
  allCharacters: Character[];
}

// === ANA SEKME KAPSAYICI (Aynı kalıyor) ===
export const TriageTab = ({ projectId, allCharacters }: TriageProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'todo' | 'completed'>('todo');
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setActiveSubTab('todo')} style={{ background: activeSubTab === 'todo' ? 'purple' : 'transparent', /*...*/ }}>Yapılacaklar</button>
        <button onClick={() => setActiveSubTab('completed')} style={{ background: activeSubTab === 'completed' ? 'purple' : 'transparent', /*...*/ }}>Tamamlananlar</button>
      </div>
      {activeSubTab === 'todo' ? (
        <TriageWorkspace 
        key={refreshTrigger}
        projectId={projectId} 
        // allLines'ı artık paslamıyoruz
        allCharacters={allCharacters} />
      ) : (
        <CompletedWorkspace projectId={projectId} onUndo={() => setRefreshTrigger(p => p + 1)} />
      )}
    </div>
  );
};


// === ÇALIŞMA ALANI - HOOK KURALLARINA UYGUN NİHAİ VERSİYON ===
const TriageWorkspace = ({ projectId, allCharacters }: TriageProps) => {
  // ====================================================================
  // ADIM 1: TÜM HOOK'LARI KOŞULSUZ OLARAK EN ÜSTE TAŞIYORUZ
  // ====================================================================
  const [allLines, setAllLines] = useState<TranslationLine[]>([]);
  const [isLinesLoading, setIsLinesLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<TriageStatus>('CLASSIFYING');
  const [lastAction, setLastAction] = useState<(() => Promise<void>) | null>(null);
  const [previousAsset, setPreviousAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [highlightedLineIndex, setHighlightedLineIndex] = useState(0);
  const [activeToastId, setActiveToastId] = useState<string | null>(null);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);

  // ====================================================================
  // ADIM 2: VERİ İŞLEME VE DİĞER FONKSİYONLARI TANIMLIYORUZ
  // ====================================================================
  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assets?classification=UNCLASSIFIED&limit=10`);
      if (!res.ok) throw new Error("Ses dosyaları getirilemedi.");
      const data = await res.json();
      setAssets(data.assets || []);
      setCurrentIndex(0);
    } catch (error: any) {
      toast.error(error.message);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  

  const filteredLines = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 2) return [];
    const lowercasedTerm = searchTerm.toLowerCase();
    return allLines
      .filter((line: TranslationLine) => !line.originalVoiceReferenceAssetId)
      .filter((line: TranslationLine) => line.originalText?.toLowerCase().includes(lowercasedTerm))
      .slice(0, 10);
  }, [searchTerm, allLines]);
  useEffect(() => { fetchAssets(); }, [fetchAssets]);
  const currentAsset = assets[currentIndex];

  const { 
    waveform, 
    progress, 
    isLoading: isWaveformLoading, 
    error: waveformError, 
    isPlaying, 
    playPause, 
    seekTo 
  } = useAudioWaveform(currentAsset?.path || null);

  // YENİ useEffect: Asset değiştiğinde başlığı daralt.
  useEffect(() => {
    setIsTitleExpanded(false);
  }, [currentAsset]);

  const advanceToNext = useCallback(() => {
    setStatus('CLASSIFYING');
    setSearchTerm('');
    setSelectedCharacterId(null);
    setHighlightedLineIndex(0);

    if (currentIndex < assets.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.success("Bu sayfadaki tüm sesler bitti, yenileri getiriliyor...");
      fetchAssets();
    }
    // Artık audioRef'e ihtiyacımız olmadığı için bağımlılıklardan da kaldırabiliriz.
  }, [currentIndex, assets.length, fetchAssets]);

  const handleClassify = useCallback(async (classification: AssetClassification) => {
    if (!currentAsset) return;
    const undoFunction = async () => {
      await fetch(`/api/assets/${currentAsset.id}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification: AssetClassification.UNCLASSIFIED }),
      });
    };
    setLastAction(() => undoFunction);
    setPreviousAsset(currentAsset);
    const toastId = toast.loading("Sınıflandırılıyor...");
    try {
      const res = await fetch(`/api/assets/${currentAsset.id}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification }),
      });
      if (!res.ok) throw new Error("Sınıflandırma başarısız.");
      toast.success("Ortam sesi olarak işaretlendi.", { id: toastId });
      advanceToNext();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }, [currentAsset, advanceToNext]);

  const handleLink = useCallback(async (line: TranslationLine) => {
    if (!selectedCharacterId || !currentAsset) return;
    const undoFunction = async () => {
      await fetch(`/api/assets/${currentAsset.id}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification: AssetClassification.UNCLASSIFIED }),
      });
      await fetch(`/api/assets/${currentAsset.id}/unlink`, { method: 'POST' });
    };
    setLastAction(() => undoFunction);
    setPreviousAsset(currentAsset);
    const toastId = toast.loading("Eşleştiriliyor...");
    try {
      const res = await fetch(`/api/translation-lines/${line.id}/link-audio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: currentAsset.id, characterId: selectedCharacterId }),
      });
      if (!res.ok) throw new Error("Eşleştirme başarısız.");
      toast.success("Başarıyla eşleştirildi.", { id: toastId });
      advanceToNext();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }, [selectedCharacterId, currentAsset, advanceToNext]);

  const handleConfirmLink = useCallback(() => {
    if (!searchTerm.trim()) {
      if (!currentAsset) return;
      const toastId = toast(
        (t) => (
          <span style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <span>...emin misiniz?</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { toast.dismiss(t.id); setActiveToastId(null); }}>İptal</button>
              <button onClick={() => { 
                handleClassify(AssetClassification.NON_DIALOGUE_VOCAL); 
                toast.dismiss(t.id); 
                setActiveToastId(null); 
              }}>
                Evet, Onayla
              </button>
            </div>
          </span>
        ), { duration: 10000 }
      );
      setActiveToastId(toastId);
      return;
    }
    if (filteredLines[highlightedLineIndex]) {
      handleLink(filteredLines[highlightedLineIndex]);
    } else {
      toast.error("Lütfen listeden geçerli bir metin seçin.");
    }
  }, [searchTerm, currentAsset, filteredLines, highlightedLineIndex, handleClassify, handleLink]);

  const handleUndoLastAction = useCallback(async () => {
    if (!lastAction || !previousAsset) {
      toast.error("Geri alınacak bir işlem yok.");
      return;
    }
    const toastId = toast.loading("Son işlem geri alınıyor...");
    try {
      await lastAction();
      setAssets(prev => [previousAsset, ...prev.filter(a => a.id !== previousAsset.id)]);
      setCurrentIndex(0);
      setLastAction(null);
      setPreviousAsset(null);
      toast.success("İşlem geri alındı.", { id: toastId });
    } catch (error) {
      toast.error("Geri alma başarısız.", { id: toastId });
    }
  }, [lastAction, previousAsset]);

  // ====================================================================
  // ADIM 3: TÜM useEffect'leri en sonda GRUPLUYORUZ
  // ====================================================================
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    const fetchTranslationLines = async () => {
      setIsLinesLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/translation-lines`);
        if (!res.ok) throw new Error("Çeviri satırları getirilemedi.");
        const lines = await res.json();
        setAllLines(lines);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLinesLoading(false);
      }
    };
    fetchTranslationLines();
  }, [projectId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeToastId && e.key === 'Enter') {
        e.preventDefault();
        handleClassify(AssetClassification.NON_DIALOGUE_VOCAL);
        toast.dismiss(activeToastId);
        setActiveToastId(null);
        return;
      }
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.closest('.react-select__control'))) {
        if (status === 'LINKING' && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {} 
        else { return; }
      }
      if (e.code === 'Space') {
          e.preventDefault();
          playPause(); // Hook'tan gelen fonksiyonu çağır
      }
      if (status === 'CLASSIFYING') {
        if (e.code === 'Digit1') { handleClassify(AssetClassification.AMBIANCE); }
        if (e.code === 'Digit2') { e.preventDefault(); setStatus('LINKING'); }
      } else if (status === 'LINKING') {
        if (e.key === 'Escape') { setStatus('CLASSIFYING'); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedLineIndex(p => Math.min(p + 1, filteredLines.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedLineIndex(p => Math.max(p - 1, 0)); }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirmLink();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, filteredLines, highlightedLineIndex, activeToastId, advanceToNext, handleClassify, handleLink, handleConfirmLink, playPause]);

  // ====================================================================
  // ADIM 4: RENDER BLOĞU
  // ====================================================================
  if (isLoading || isLinesLoading) return <p>Yükleniyor...</p>;
  if (!currentAsset && !isLoading) return <p>Tebrikler! Bu bölümdeki tüm sesleri sınıflandırdınız.</p>;

  const prevAsset = previousAsset; // 'previousAsset' state'ini kullanıyoruz
  const nextAsset = assets[currentIndex + 1];
  // YENİ: Dosya ismini kısaltan bir yardımcı fonksiyon
  const truncateName = (name: string, length: number = 20) => {
    if (name.length <= length) {
      return name;
    }
    return name.slice(0, length) + '...';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        {/* Önceki (Geri Al) Butonu */}
        <div 
          onClick={handleUndoLastAction}
          style={{ 
            opacity: lastAction ? 1 : 0.5, 
            textAlign: 'center', 
            minWidth: '150px',
            cursor: lastAction ? 'pointer' : 'default',
            padding: '10px',
            border: lastAction ? '1px solid white' : 'none',
            borderRadius: '8px'
          }}
        >
        <div onClick={handleUndoLastAction} style={{ cursor: lastAction ? 'pointer' : 'not-allowed', textAlign: 'center' }}>
              <p style={{fontSize: '0.8rem'}}>Önceki (Geri Al)</p>
            {/* DÜZELTME: İsmi kısaltarak gösteriyoruz */}
            {prevAsset ? <p title={prevAsset.name}>{truncateName(prevAsset.name)}</p> : <p>--</p>} 
        </div>
        </div>
        <div style={{ flexGrow: 1, maxWidth: '600px', border: `2px solid purple`, padding: '10px', borderRadius: '8px' }}>
              {/* DÜZELTME: Başlık bölümünü tamamen değiştiriyoruz */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', minHeight: '24px' }}>
                <h4 style={{ margin: 0, textAlign: 'right' }} title={currentAsset?.name}>
                    {currentAsset ? 
                        (isTitleExpanded ? currentAsset.name : truncateName(currentAsset.name, 40)) 
                        : "Yükleniyor..."}
                </h4>
                {/* Sadece isim uzunsa butonu göster */}
                {currentAsset && currentAsset.name.length > 40 && (
                    <button
                        onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#A855F7', // Temaya uygun mor renk
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                        }}
                    >
                        {isTitleExpanded ? '(Gizle)' : 'Tam İsim'}
                    </button>
                )}
            </div>
              {isWaveformLoading && <p>Waveform yükleniyor...</p>}
              {waveformError && <p style={{color: 'red'}}>Hata: {waveformError}</p>}
              {waveform.length > 0 && (
                  <WaveformPlayer
                      waveform={waveform}
                      progress={progress}
                      isPlaying={isPlaying}
                      onCanvasClick={(percentage) => seekTo(percentage * 100)}
                  />
              )}
          </div>
        {/* Sonraki Butonu */}
        <div style={{ opacity: 0.5, textAlign: 'center', minWidth: '150px' }}>
                <p style={{fontSize: '0.8rem'}}>Sonraki</p>
            {/* DÜZELTME: İsmi kısaltarak gösteriyoruz */}
            {nextAsset ? <p title={nextAsset.name}>{truncateName(nextAsset.name)}</p> : <p>--</p>}
        </div>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#1e1e1e', borderRadius: '8px', minHeight: '250px' }}>
            {status === 'CLASSIFYING' ? (
                <div style={{ textAlign: 'center' }}>
                    <h4>Bu ses nedir?</h4>
                    <p style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        <button onClick={() => handleClassify(AssetClassification.AMBIANCE)}>[1] Ortam Sesi</button>
                        <button onClick={() => setStatus('LINKING')}>[2] Diyalog</button>
                    </p>
                </div>
            ) : (
                <div>
                    {/* YENİ: Başlık ve Geri Dön Butonu */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>Diyalog Eşleştirme</h4>
                        <button onClick={() => setStatus('CLASSIFYING')}>[ESC] ile Geri Dön</button>
                    </div>
                    <Select options={allCharacters.map((c: Character) => ({ value: c.id, label: c.name }))} onChange={(opt: any) => setSelectedCharacterId(opt ? opt.value : null)} placeholder="Karakter Seç..." instanceId="character-select" classNamePrefix="react-select" />
                    <input type="text" autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Metin ara... (Aramak için buraya tıklayın)" style={{width: '100%', padding: '8px', marginTop: '10px', background: '#333', border: '1px solid #555', color: 'white'}} />
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
                        {/* Arama Sonuçları */}
                    <div style={{ maxHeight: '200px', /*...*/ }}>
                        {/* Arama terimi yoksa bir bilgilendirme mesajı göster */}
                        {searchTerm.trim().length < 2 && (
                            <div style={{padding: '10px', color: '#aaa'}}>
                                Metin bulmak için en az 2 karakter yazın.<br/>
                                Veya bu sesi diyalogsuz olarak atamak için arama kutusunu boş bırakıp Onayla'ya tıklayın.
                            </div>
                        )}
                        {filteredLines.map((line: TranslationLine, index: number) => (
                            <div key={line.id} 
                                 style={{ background: index === highlightedLineIndex ? '#A855F7' : '#333', /*...*/ }}
                                 // Tıklamayı da onaylama fonksiyonuna bağlayalım
                                 onClick={() => handleLink(line)}
                            >
                                "{line.originalText}"
                            </div>
                        ))}
                    </div>
                    {/* YENİ: Onayla Butonu */}
                    
                    </div>
                    <div style={{textAlign: 'center', marginTop: '10px'}}>
                        <p style={{fontSize: '0.9rem', color: '#aaa'}}>Yukarı/Aşağı oklarla seçin</p>
                        <button 
                            onClick={handleConfirmLink}
                            style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}
                        >
                            [Enter] ile Onayla
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

// === TAMAMLANANLAR SEKMESİ ===
const CompletedWorkspace = ({ projectId, onUndo }: { projectId: number, onUndo: () => void }) => {
    // State'in tipini yeni oluşturduğumuz CompletedAsset tipiyle güncelliyoruz
    const [completedAssets, setCompletedAssets] = useState<CompletedAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCompleted = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/assets?classification=ALL_BUT_UNCLASSIFIED`);
            if (!res.ok) throw new Error("Tamamlananlar getirilemedi.");
            const data = await res.json();
            setCompletedAssets(data.assets || []);
        } catch(error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchCompleted(); }, [fetchCompleted]);
    
    const handleUndo = async (assetId: number) => {
        const toastId = toast.loading("İşlem geri alınıyor...");
        try {
            await fetch(`/api/assets/${assetId}/classify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classification: AssetClassification.UNCLASSIFIED }),
            });
            await fetch(`/api/assets/${assetId}/unlink`, { method: 'POST' });

            toast.success("Geri alındı!", { id: toastId });
            onUndo();
            setCompletedAssets(prev => prev.filter(asset => asset.id !== assetId));
        } catch (error) {
            toast.error("Geri alınamadı.", { id: toastId });
        }
    };

    if (isLoading) return <p>Tamamlananlar yükleniyor...</p>;

    return (
        <div>
            <h3>Tamamlanan Eşleştirmeler</h3>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                    <tr style={{borderBottom: '1px solid #555'}}>
                        {/* YENİ SÜTUNLAR: Oynatıcı, Atanan Metin */}
                        <th style={{textAlign: 'left', padding: '8px', width: '35%'}}>Oynatıcı</th>
                        <th style={{textAlign: 'left', padding: '8px', width: '35%'}}>Atanan Metin (ve Karakter)</th>
                        <th style={{textAlign: 'left', padding: '8px', width: '15%'}}>Sınıflandırma</th>
                        <th style={{textAlign: 'right', padding: '8px', width: '15%'}}>İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    {completedAssets.map((asset) => {
                        // Atanmış metin ve karakter bilgisini alalım
                        const linkedLine = asset.referencedTranslationLines[0];
                        const displayText = linkedLine?.originalText || 'N/A';
                        const characterName = linkedLine?.character?.name;

                        return (
                            <tr key={asset.id} style={{borderBottom: '1px solid #333'}}>
                                {/* YENİ: Dosya ismi yerine audio oynatıcı */}
                                <td style={{padding: '8px'}}>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <span style={{fontSize: '0.8em', color: '#aaa'}}>{asset.name}</span>
                                        {asset.type === 'AUDIO' && (
                                            <audio src={asset.path} controls style={{height: '40px', width: '100%'}} />
                                        )}
                                    </div>
                                </td>
                                {/* YENİ: Atanan metni göster */}
                                <td style={{padding: '8px'}}>
                                    "{displayText}"
                                    {characterName && <span style={{display: 'block', fontSize: '0.8em', color: 'lightblue'}}>Karakter: {characterName}</span>}
                                </td>
                                <td style={{padding: '8px'}}>{asset.classification}</td>
                                <td style={{textAlign: 'right', padding: '8px'}}>
                                    <button onClick={() => handleUndo(asset.id)}>Geri Al</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
