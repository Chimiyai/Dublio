//src/components/projects/WaveformPlayer.tsx
import React, { useRef, useEffect } from 'react';

// YENİ: Seçim aralığı için tip tanımı
export interface SelectionRange {
  start: number; // Yüzde (0-100)
  end: number;   // Yüzde (0-100)
}

interface WaveformPlayerProps {
  waveform: number[];
  progress: number;
  isPlaying: boolean;
  duration: number;
  onCanvasClick: (percentage: number) => void;
  // YENİ PROPLAR: Fare olaylarını ve seçim aralığını yönetmek için
  selection?: SelectionRange | null;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({ 
    duration, waveform, progress, selection, onCanvasClick, 
    onMouseDown, onMouseMove, onMouseUp, onMouseLeave 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveform.length === 0) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveform.length;
    const maxAmp = Math.max(...waveform) * 1.5 || 1; 

    context.clearRect(0, 0, width, height);


    
    // YENİ: Seçim bölgesini çiz
    if (selection) {
        context.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Seçim bölgesi rengi
        const selectionStartPx = (selection.start / 100) * width;
        const selectionWidthPx = ((selection.end - selection.start) / 100) * width;
        context.fillRect(selectionStartPx, 0, selectionWidthPx, height);
    }

    // Waveform'u çiz (Bu kısım aynı)
    waveform.forEach((amp, i) => {
      const barHeight = (amp / maxAmp) * height * 0.8;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;
      
      if ((x / width) * 100 < progress) {
        context.fillStyle = '#A855F7';
      } else {
        context.fillStyle = '#4F4A85';
      }
      context.fillRect(x, y, barWidth - 1, barHeight);
    });
    // YENİ: Zaman Çizelgesini Çizme
    const drawTimeMarkers = () => {
        if (duration > 0) {
            context.font = '10px Arial';
            context.fillStyle = '#999';
            const interval = Math.floor(duration / 5); // Yaklaşık 5 zaman etiketi göster
            for (let i = 1; i <= 5; i++) {
                const time = i * interval;
                if (time < duration) {
                    const x = (time / duration) * width;
                    const timeString = new Date(time * 1000).toISOString().substr(14, 5); // MM:SS formatı
                    context.fillText(timeString, x, height - 5);
                }
            }
        }
    };

    drawTimeMarkers(); // Fonksiyonu çağır

}, [waveform, progress, selection, duration]);
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Sürükleme işlemi başlamadıysa, seek işlemi yap
    if (!e.buttons) { // e.buttons === 0 ise fare basılı değil demektir
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        onCanvasClick(percentage);
    }
  };

  return (
    <div style={{ position: 'relative', cursor: 'pointer' }}>
      <canvas
        ref={canvasRef}
        width="600"
        height="100"
        onClick={handleCanvasClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
};