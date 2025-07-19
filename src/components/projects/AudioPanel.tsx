//src/components/projects/AudioPanel.tsx
'use client';

import { useEffect } from 'react';
import { useAudioWaveform } from '@/lib/hooks/useAudioWaveform';
import { WaveformPlayer } from './WaveformPlayer';

interface AudioPanelProps {
  url: string | null | undefined;
  title: string;
}

export const AudioPanel = ({ url, title }: AudioPanelProps) => {
  const { waveform, progress, isPlaying, isLoading, duration, loadAudio, play, pause, seekTo } = useAudioWaveform();

  useEffect(() => {
    if (url) {
      loadAudio(url);
    }
    // NOT: Bağımlılık listesinden loadAudio'yu çıkarmak,
    // hook'un gereksiz yere yeniden çalışmasını engelleyebilir.
    // Çünkü loadAudio fonksiyonunun kimliği (referansı) her render'da değişebilir.
  }, [url]);

  if (!url) {
    return (
        <div style={{ background: '#1c1c1c', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <h4>{title}</h4>
            <p style={{color: '#777'}}>Ses dosyası bulunmuyor.</p>
        </div>
    );
  }

  return (
    <div style={{ background: '#1c1c1c', padding: '10px', borderRadius: '4px' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h4>{title}</h4>
            <a href={url} download style={{fontSize: '0.8em'}}>İndir</a>
        </div>
        
        {isLoading && <p>Waveform yükleniyor...</p>}
        
        <WaveformPlayer
            waveform={waveform}
            progress={progress}
            isPlaying={isPlaying}
            onCanvasClick={(percentage) => seekTo(percentage * 100)}
        />
        
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px'}}>
            <button onClick={isPlaying ? pause : play}>
                {isPlaying ? 'Durdur' : 'Oynat'}
            </button>
            <span style={{fontSize: '0.8em', color: '#aaa'}}>Süre: {duration.toFixed(2)}s</span>
        </div>
    </div>
  );
};