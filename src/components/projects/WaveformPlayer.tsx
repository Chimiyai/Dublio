//src/components/projects/WaveformPlayer.tsx
import React, { useRef, useEffect } from 'react';

interface WaveformPlayerProps {
  waveform: number[];
  progress: number;
  isPlaying: boolean; // DÜZELTME: Bu eksik prop'u ekliyoruz.
  onCanvasClick: (percentage: number) => void;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({ waveform, progress, onCanvasClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveform.length === 0) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveform.length;
    // Maksimum genliği hesapla ve çok küçükse 1 olarak varsay
    const maxAmp = Math.max(...waveform) * 1.5 || 1; 

    // Her çizimden önce canvas'ı temizle
    context.clearRect(0, 0, width, height);
    
    // Waveform'u çiz
    waveform.forEach((amp, i) => {
      const barHeight = (amp / maxAmp) * height * 0.8;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;
      
      // NİHAİ DÜZELTME: İlerleme çubuğunun geçtiği yerleri farklı renkte çiz
      // progress state'i 0-100 arası bir yüzde değeridir.
      // Her çubuğun yüzdelik konumunu (x / width * 100) hesaplayıp karşılaştırıyoruz.
      if ((x / width) * 100 < progress) {
        context.fillStyle = '#A855F7'; // Oynatılmış kısım (Canlı Mor)
      } else {
        context.fillStyle = '#4F4A85'; // Oynatılmamış kısım (Soluk Mor)
      }
      
      context.fillRect(x, y, barWidth - 1, barHeight);
    });
  }, [waveform, progress]); // Bu useEffect, hem waveform hem de progress değiştiğinde tekrar çalışır.
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    onCanvasClick(percentage);
  };

  return (
    <div style={{ position: 'relative', cursor: 'pointer' }}>
      <canvas
        ref={canvasRef}
        width="600"
        height="100"
        onClick={handleCanvasClick}
      />
    </div>
  );
};