//src/components/projects/WaveformEditor.tsx
'use-client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAudioWaveform } from '@/lib/hooks/useAudioWaveform';
import { WaveformPlayer, SelectionRange } from './WaveformPlayer';
import { toast } from 'react-hot-toast';
import { AudioProcessor } from '@/lib/AudioProcessor'; 

interface WaveformEditorProps {
  url: string | null | undefined;
  readOnly?: boolean;
  onAudioProcess?: (newAudioBlob: Blob) => void;
}

export const WaveformEditor = ({ url, readOnly = false, onAudioProcess }: WaveformEditorProps) => {
  const { waveform, progress, isPlaying, isLoading, duration, loadAudio, play, pause, seekTo, audioBuffer } = useAudioWaveform();
  
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const isDragging = useRef(false);
  const dragStartPercent = useRef(0);
  
  // YENİ: Düzenleme geçmişini ve mevcut Blob'u tutmak için state'ler
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const originalAudioBuffer = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    if (url) {
      loadAudio(url);
      setSelection(null);
      setCurrentBlob(null); // Yeni ses yüklendiğinde düzenlenmiş blob'u temizle
    }
  }, [url, loadAudio]);
  
  // YENİ: audioBuffer ilk yüklendiğinde orijinal halini bir ref'te sakla
  useEffect(() => {
      if (audioBuffer && !originalAudioBuffer.current) {
          originalAudioBuffer.current = audioBuffer;
      }
  }, [audioBuffer]);
  
  const getPercentFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    const percent = getPercentFromEvent(e);
    dragStartPercent.current = percent;
    setSelection({ start: percent, end: percent });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const percent = getPercentFromEvent(e);
    setSelection({
      start: Math.min(dragStartPercent.current, percent),
      end: Math.max(dragStartPercent.current, percent)
    });
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
        // Eğer çok küçük bir seçim yapıldıysa (sadece tıklandıysa), seçimi iptal et
        if (selection && Math.abs(selection.end - selection.start) < 0.5) {
            setSelection(null);
        }
        isDragging.current = false;
    }
  };
  
  const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(14, 8);

  const handleProcessAndUpdate = async (processedBuffer: AudioBuffer) => {
    const newBlob = await AudioProcessor.toWavBlob(processedBuffer);
    setCurrentBlob(newBlob); // YENİ: Düzenlenmiş Blob'u state'e kaydet
    
    if (onAudioProcess) {
      onAudioProcess(newBlob);
    }
    
    // Arayüzü yeni sesle güncelle
    loadAudio(newBlob);
  };

  const handleTrim = async () => {
    if (!audioBuffer || !selection) return toast.error("Lütfen önce bir alan seçin.");
    
    const startSeconds = duration * (selection.start / 100);
    const endSeconds = duration * (selection.end / 100);

    try {
        const newBuffer = await AudioProcessor.trim(audioBuffer, startSeconds, endSeconds);
        toast.success("Kırpma başarılı!");
        handleProcessAndUpdate(newBuffer);
        setSelection(null); // İşlem sonrası seçimi temizle
    } catch (error: any) {
        toast.error(error.message || "Kırpma başarısız oldu.");
    }
  };

  const handleAddSilence = async (position: 'start' | 'end') => {
    if (!audioBuffer) return;
    const silenceDuration = parseFloat(prompt("Eklenecek sessizlik süresini saniye olarak girin (örn: 0.5):", "0.5") || "0");
    if (isNaN(silenceDuration) || silenceDuration <= 0) return;

    try {
        const newBuffer = await AudioProcessor.addSilence(audioBuffer, silenceDuration, position);
        toast.success("Sessizlik eklendi!");
        handleProcessAndUpdate(newBuffer);
    } catch (error: any) {
        toast.error(error.message || "İşlem başarısız oldu.");
    }
  };

  // YENİ: Düzenlemeyi geri alan fonksiyon
  const handleUndoEdits = () => {
      if (originalAudioBuffer.current && url) {
          loadAudio(url); // En baştaki orijinal URL'den sesi yeniden yükle
          setCurrentBlob(null); // Düzenlenmiş blob'u temizle
          if (onAudioProcess) {
              onAudioProcess(null as any); // Ana component'e de değişikliğin iptal olduğunu bildir
          }
          toast.success("Düzenlemeler geri alındı.");
      }
  };

  // YENİ: Önizleme indirme fonksiyonu
  const handleDownloadPreview = () => {
    if (!currentBlob) {
        toast.error("İndirilecek düzenlenmiş bir ses yok.");
        return;
    }
    // Geçici bir link oluşturup tıklamayı simüle et
    const downloadUrl = URL.createObjectURL(currentBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = "edited_preview.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div style={{ background: '#1c1c1c', padding: '10px', borderRadius: '4px' }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          {/* Orijinal dosyayı indirme linki */}
          <a href={url || '#'} download style={{fontSize: '0.8em', color: '#9ec5f7'}}>Orijinali İndir</a>
      </div>
      
      {isLoading && <p>Waveform yükleniyor...</p>}
      
      <WaveformPlayer
        waveform={waveform} progress={progress} isPlaying={isPlaying}
        selection={selection}
        onMouseDown={!readOnly ? handleMouseDown : undefined}
        onMouseMove={!readOnly ? handleMouseMove : undefined}
        onMouseUp={!readOnly ? handleMouseUpOrLeave : undefined}
        onMouseLeave={!readOnly ? handleMouseUpOrLeave : undefined}
        onCanvasClick={(percentage) => seekTo(percentage * 100)}
        duration={duration}
      />
      
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <button onClick={isPlaying ? pause : play} disabled={isLoading}>
                {isPlaying ? 'Durdur' : 'Oynat'}
            </button>
            <span style={{fontSize: '0.8em', color: '#aaa'}}>Süre: {duration.toFixed(2)}s</span>
        </div>
        
        {!readOnly && selection && (
            <div style={{fontSize: '0.8em', color: 'lightblue', background: 'rgba(255, 255, 255, 0.1)', padding: '5px', borderRadius: '4px'}}>
                Seçim: {formatTime(duration * (selection.start / 100))} - {formatTime(duration * (selection.end / 100))}
                <button onClick={() => setSelection(null)} style={{marginLeft: '10px'}}>Temizle</button>
            </div>
        )}
      </div>
      
      {/* YENİ: Ses İşleme Butonları */}
      {!readOnly && (
        <div style={{borderTop: '1px solid #333', marginTop: '10px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {/* Ses İşleme Butonları */}
            <div style={{display: 'flex', justifyContent: 'center', gap: '10px'}}>
                <button onClick={() => handleAddSilence('start')} disabled={isLoading || !audioBuffer}>
                    Başa Sessizlik Ekle
                </button>
                <button onClick={handleTrim} disabled={isLoading || !selection}>
                    Seçili Alanı Kırp
                </button>
                <button onClick={() => handleAddSilence('end')} disabled={isLoading || !audioBuffer}>
                    Sona Sessizlik Ekle
                </button>
            </div>
            
            {/* YENİ: Geri Al ve Önizleme İndir Butonları */}
            {currentBlob && (
                <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '5px'}}>
                    <button onClick={handleDownloadPreview} style={{background: '#0ea5e9'}}>
                        Düzenlenmiş Halini İndir
                    </button>
                    <button onClick={handleUndoEdits} style={{background: '#ef4444'}}>
                        Tüm Düzenlemeleri Geri Al
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};