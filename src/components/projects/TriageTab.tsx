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
    id: number;
    originalText: string | null;
    isNonDialogue: boolean;
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

type LastAction = {
  type: 'CLASSIFY_AMBIANCE' | 'CLASSIFY_NON_DIALOGUE' | 'LINK_DIALOGUE';
  assetId: number;
  linkedLineId?: number; 
};

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
  
  // DÜZELTME: Bu iki state'in tipi ve başlangıç değeri güncellendi
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
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
        // NİHAİ DÜZELTME: Bu isteğin asla önbellekten gelmemesini sağlıyoruz.
        const res = await fetch(`/api/projects/${projectId}/assets?classification=UNCLASSIFIED&limit=10`, { cache: 'no-store' });
        
        if (!res.ok) throw new Error("Ses dosyaları getirilemedi.");
        const data = await res.json();
        setAssets(data.assets || []);
        setCurrentIndex(0); // Her zaman en baştan başla
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

  const { waveform, progress, isLoading: isWaveformLoading, error: waveformError, isPlaying, playPause, seekTo, loadAudio } = useAudioWaveform();

  // YENİ useEffect: currentAsset değiştiğinde, sesi YÜKLE
  useEffect(() => {
    // Ses dosyasını yükleyen effect
    if (currentAsset?.path) {
      loadAudio(currentAsset.path);
    }
  }, [currentAsset, loadAudio]);

  // YENİ useEffect: Asset değiştiğinde başlığı daralt.
  useEffect(() => {
    setIsTitleExpanded(false);
  }, [currentAsset]);

  const advanceToNext = useCallback((processedAssetId: number) => {
    // Arayüzü temizle
    setStatus('CLASSIFYING');
    setSearchTerm('');
    setSelectedCharacterId(null);
    setHighlightedLineIndex(0);

    // İşlenen asset'i listeden çıkararak state'i GÜVENLİ bir şekilde güncelle
    const newAssets = assets.filter(asset => asset.id !== processedAssetId);
    setAssets(newAssets);

    // Eğer yeni liste boşaldıysa, sunucudan yenilerini çek
    if (newAssets.length === 0) {
      toast.success("Bu sayfadaki tüm sesler bitti, yenileri getiriliyor...");
      fetchAssets();
    }
  }, [assets, fetchAssets]); // Bağımlılıkları sadeleştir

  // ==========================================================
  // handleClassify FONKSİYONUNUN YENİ HALİ
  // ==========================================================
  const handleClassify = useCallback(async (classification: AssetClassification) => {
    if (!currentAsset) return;

    const assetToProcess = currentAsset; // İşlem yapılacak asset'i bir değişkene kaydet

    const undoFunction = async () => {
      await fetch(`/api/assets/${currentAsset.id}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification: AssetClassification.UNCLASSIFIED }),
      });
    };
    
    const toastId = toast.loading("Sınıflandırılıyor...");
    try {
      const res = await fetch(`/api/assets/${assetToProcess.id}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification }),
      });
      if (!res.ok) throw new Error("Sınıflandırma başarısız.");
      
      toast.success("Ortam sesi olarak işaretlendi.", { id: toastId });

      setLastAction({
          type: classification === AssetClassification.AMBIANCE ? 'CLASSIFY_AMBIANCE' : 'CLASSIFY_NON_DIALOGUE',
          assetId: assetToProcess.id,
        });
        setPreviousAsset(assetToProcess);
        advanceToNext(assetToProcess.id);
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }, [currentAsset, advanceToNext]); // Bağımlılıkları sadeleştir


  // ==========================================================
  // handleLink FONKSİYONUNUN YENİ HALİ
  // ==========================================================
  const handleLink = useCallback(async (line: TranslationLine) => {
    if (!selectedCharacterId || !currentAsset) return;

    const assetToProcess = currentAsset; // İşlem yapılacak asset'i bir değişkene kaydet

    const undoFunction = async () => {
      // Hem classify'ı geri alır hem de link'i koparır
      await fetch(`/api/assets/${currentAsset.id}/unlink`, { method: 'POST' });
    };

    const toastId = toast.loading("Eşleştiriliyor...");
    try {
      const res = await fetch(`/api/translation-lines/${line.id}/link-audio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: currentAsset.id, characterId: selectedCharacterId }),
      });
      if (!res.ok) throw new Error("Eşleştirme başarısız.");
      
      toast.success("Başarıyla eşleştirildi.", { id: toastId });

      setLastAction({
          type: 'LINK_DIALOGUE',
          assetId: assetToProcess.id,
          linkedLineId: line.id,
        });
        setPreviousAsset(assetToProcess);
        advanceToNext(assetToProcess.id);
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  }, [selectedCharacterId, currentAsset, advanceToNext]); // Bağımlılıkları sadeleştir

  const handleConfirmLink = useCallback(() => {
    if (!currentAsset) return;

    // Durum 1: Arama kutusu BOŞ
    if (!searchTerm.trim()) {
        // Durum 1a: Karakter SEÇİLMEMİŞ -> Bu basit bir ortam sesidir.
        if (!selectedCharacterId) {
            toast.error("Lütfen bir metin arayın veya bu sesin bir karaktere ait olmayan bir efekt olduğunu belirtmek için 'Ortam Sesi' butonunu kullanın.");
            return;
        }

        // Durum 1b: Karakter SEÇİLMİŞ -> Bu, o karaktere ait diyalogsuz bir vokaldir (inleme vb.)
        const toastId = toast.loading(`${selectedCharacterId} ID'li karaktere diyalogsuz vokal olarak atanıyor...`);
        fetch(`/api/assets/${currentAsset.id}/link-character-non-dialogue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterId: selectedCharacterId })
        })
        .then(res => {
            if (!res.ok) throw new Error("Atama başarısız.");
            return res.json();
        })
        .then(() => {
            toast.success("Karaktere özel efekt olarak atandı.", { id: toastId });
            
            // DÜZELTME: Geri alma bilgilerini burada da kaydediyoruz
            // (Bu mantığı eklemek tutarlılık için önemlidir)
            const undoFunction = async () => {
                await fetch(`/api/assets/${currentAsset.id}/unlink`, { method: 'POST' });
            };
            setLastAction({
            type: 'CLASSIFY_NON_DIALOGUE', // Bu bir diyalogsuz atama
            assetId: currentAsset.id
        });
        setPreviousAsset(currentAsset);
        advanceToNext(currentAsset.id);
    })
        .catch(err => {
            // API'den gelen daha anlamlı hata mesajını göster
            toast.error(err.message || "Atama sırasında bir hata oluştu.", { id: toastId });
        });

        return;
    }

    // Durum 2: Arama kutusu DOLU -> Bu, metinli bir diyalogdur.
    if (filteredLines[highlightedLineIndex]) {
        handleLink(filteredLines[highlightedLineIndex]);
    } else {
        toast.error("Lütfen listeden geçerli bir metin seçin.");
    }
  }, [currentAsset, searchTerm, selectedCharacterId, filteredLines, highlightedLineIndex, assets, currentIndex, handleLink, advanceToNext, fetchAssets]);

  const handleUndoLastAction = useCallback(async () => {
    if (!lastAction) {
      toast.error("Geri alınacak bir işlem yok.");
      return;
    }

    const toastId = toast.loading("Son işlem geri alınıyor...");
    try {
      // 1. Her durumda, asset'in classification'ını UNCLASSIFIED'e geri döndür.
      // Bu adım doğru ve kalmalı.
      await fetch(`/api/assets/${lastAction.assetId}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification: AssetClassification.UNCLASSIFIED }),
      });

      // ====================================================================
      // === DÜZELTME BURADA ===
      // ====================================================================

      // 2. İşlemin tipine göre doğru temizliği yap.
      if (lastAction.type === 'LINK_DIALOGUE') {
        // Eğer bir diyalog bağlanmışsa, sadece bağlantıyı kopar.
        await fetch(`/api/assets/${lastAction.assetId}/unlink`, { method: 'POST' });
      } 
      else if (lastAction.type === 'CLASSIFY_NON_DIALOGUE') {
        // EĞER DİYALOGSUZ VOKAL ATANMIŞSA, O ÖZEL TranslationLine SATIRINI SİL.
        // Doğru API endpoint'ini (`delete-by-asset`) çağırdığımızdan emin oluyoruz.
        await fetch(`/api/translation-lines/delete-by-asset/${lastAction.assetId}`, {
            method: 'DELETE'
        });
      }
      
      // ====================================================================

      // 3. State'i güncelle (Geri alınan asset'i tekrar listeye ekle)
      const res = await fetch(`/api/assets/${lastAction.assetId}`);
      const assetToRestore: Asset = await res.json();
      
      if (assetToRestore) {
          // Geri alınan asset'i "Yapılacaklar" listesinin başına ekle
          setAssets(prev => [assetToRestore, ...prev.filter(a => a.id !== lastAction.assetId)]);
          // currentIndex'i 0'a çekerek yeni gelen asset'in gösterilmesini sağla
          setCurrentIndex(0);
      }
      
      // Geri alma state'ini temizle
      setLastAction(null);
      
      toast.success("İşlem geri alındı.", { id: toastId });

    } catch (error) {
      toast.error("Geri alma başarısız.", { id: toastId });
    }
    // `previousAsset`'i kaldırdığımız için bağımlılıklardan da çıkarıyoruz.
  }, [lastAction]);

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
    const [completedAssets, setCompletedAssets] = useState<CompletedAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCompleted = useCallback(async () => {
        setIsLoading(true);
        try {
            // API'den zenginleştirilmiş veriyi çekiyoruz (bu kısım doğru)
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
    
    // ====================================================================
    // === handleUndo FONKSİYONUNUN NİHAİ HALİ ===
    // ====================================================================
    const handleUndo = async (assetToUndo: CompletedAsset) => {
        const toastId = toast.loading("İşlem geri alınıyor...");
        try {
            // Senin istediğin mantığı burada uyguluyoruz.
            const linkedLine = assetToUndo.referencedTranslationLines?.[0];

            // 1. Eğer bağlı bir satır varsa VE bu satır diyalogsuz ise, ONU SİL.
            if (linkedLine && linkedLine.isNonDialogue) {
                await fetch(`/api/translation-lines/${linkedLine.id}`, { // ID'si bilinen satırı silmek için yeni API
                    method: 'DELETE'
                });
            }

            // 2. Her durumda asset'in classification'ını UNCLASSIFIED yap
            //    ve tüm bağlantıları (varsa) kopar.
            //    Bunun için daha önce yazdığımız tek, akıllı API'yi kullanabiliriz.
            const undoRes = await fetch(`/api/assets/${assetToUndo.id}/undo`, {
                method: 'POST'
            });

            if (!undoRes.ok) {
                throw new Error("Geri alma işlemi sunucuda başarısız oldu.");
            }

            toast.success("Geri alındı!", { id: toastId });
            
            // "Yapılacaklar" listesinin yenilenmesi için ana component'e sinyal gönder
            onUndo(); 
            
            // Geri alınan asset'i bu listeden anında kaldır
            setCompletedAssets(prev => prev.filter(asset => asset.id !== assetToUndo.id));

        } catch (error: any) {
            toast.error(error.message || "Geri alınamadı.", { id: toastId });
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
                        // NİHAİ DÜZELTME: Gelen veriyi akıllıca işliyoruz
                        const linkedLine = asset.referencedTranslationLines?.[0]; // Varsa ilk bağlı satırı al
                        const characterName = linkedLine?.character?.name;
                        
                        let displayText = "N/A"; // Varsayılan metin
                        if (linkedLine) {
                            if (linkedLine.isNonDialogue) {
                                displayText = "[Diyalogsuz Vokal]";
                            } else if (linkedLine.originalText) {
                                displayText = `"${linkedLine.originalText}"`;
                            }
                        }

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
                                {/* Atanan Metin Sütunu */}
                                <td style={{padding: '8px'}}>
                                    {displayText}
                                    {characterName && (
                                        <span style={{display: 'block', fontSize: '0.8em', color: 'lightblue', marginTop: '4px'}}>
                                            Karakter: {characterName}
                                        </span>
                                    )}
                                </td>
                                
                                <td style={{padding: '8px'}}>{asset.classification}</td>
                                <td style={{textAlign: 'right', padding: '8px'}}>
    {/* DÜZELTME: Fonksiyona asset objesinin tamamını gönderiyoruz */}
    <button onClick={() => handleUndo(asset)}>Geri Al</button>
</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
