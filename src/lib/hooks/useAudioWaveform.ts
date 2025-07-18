//src/lib/hooks/useAudioWaveform.ts
import { useState, useEffect, useRef, useCallback } from 'react';

const filterData = (audioBuffer: AudioBuffer, totalBars: number) => {
  const rawData = audioBuffer.getChannelData(0); 
  const samples = totalBars;
  const blockSize = Math.floor(rawData.length / samples);
  const filteredData = [];
  for (let i = 0; i < samples; i++) {
    const blockStart = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[blockStart + j]);
    }
    filteredData.push(sum / blockSize);
  }
  return filteredData;
};

// Hook'un son ve en sağlam hali
export const useAudioWaveform = (audioUrl: string | null) => {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // NİHAİ DÜZELTME: Audio elementini hook'un İÇİNDE yaratıp yönetiyoruz.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Bu useEffect, hook ilk yüklendiğinde SADECE BİR KEZ çalışır.
  useEffect(() => {
    // Audio elementini ve context'i oluştur.
    audioRef.current = new Audio();
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audio = audioRef.current;

    // Tüm olay dinleyicilerini burada, bir kereliğine ayarla.
    const handleTimeUpdate = () => setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false); // Bittiğinde de durmuş sayılır
    const handleCanPlay = () => {
      audio.play().catch(e => console.warn("Otomatik oynatma engellendi. Kullanıcı etkileşimi bekleniyor."));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplaythrough', handleCanPlay);

    // Hook yok olduğunda (unmount) temizlik yap.
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplaythrough', handleCanPlay);
    };
  }, []); // Boş bağımlılık dizisi, bunun sadece bir kez çalışmasını sağlar.

  // Bu useEffect, audioUrl değiştiğinde çalışır.
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    setIsLoading(true);
    setError(null);
    setWaveform([]);
    setProgress(0);
    setIsPlaying(false);
    
    const audio = audioRef.current;
    audio.pause();
    audio.src = audioUrl;
    audio.load(); // Bu, 'canplaythrough' olayını güvenilir bir şekilde tetikler.

    const processAudio = async () => {
        try {
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
            const filteredData = filterData(audioBuffer, 100);
            setWaveform(filteredData);
        } catch (e: any) {
            setError("Ses verisi analiz edilemedi.");
        } finally {
            setIsLoading(false);
        }
    };
    processAudio();
  }, [audioUrl]);

  // Dışarıdan kontrol için fonksiyonlar
  const playPause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (audio.paused) audio.play();
      else audio.pause();
    }
  }, []);

  const seekTo = useCallback((percentage: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = audio.duration * (percentage / 100);
    }
  }, []);

  // Hook artık ref'i dışarı vermiyor, o bir iç detay.
  return { waveform, progress, isLoading, error, isPlaying, playPause, seekTo };
};