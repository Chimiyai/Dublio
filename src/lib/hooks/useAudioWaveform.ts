import { useState, useRef, useCallback, useEffect } from 'react';

// === HELPER FONKSİYON ===
const processAudioBuffer = (audioBuffer: AudioBuffer, totalBars: number) => {
    const rawData = audioBuffer.getChannelData(0);
    const samples = totalBars;
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j] || 0);
        }
        filteredData.push(sum / blockSize);
    }
    return filteredData;
};


// === HOOK'UN SON HALİ (TÜM HATALARI GİDERİLMİŞ) ===
export const useAudioWaveform = () => {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const loadAudio = useCallback(async (audioUrl: string) => {
    setIsLoading(true);
    setError(null);
    setWaveform([]);
    setProgress(0);
    
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
    }

    try {
        const response = await fetch(audioUrl, { mode: 'cors' });
        if (!response.ok) throw new Error(`Ses dosyası yüklenemedi (HTTP ${response.status})`);
        const arrayBuffer = await response.arrayBuffer();

        // DÜZELTME: AudioContext'i burada oluşturup null kontrolünü sağlıyoruz.
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const audioContext = audioContextRef.current; // Null olmayacağını bildiğimiz için bir değişkene atayalım.

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        const filteredData = processAudioBuffer(audioBuffer, 120);
        setWaveform(filteredData);

        const blob = new Blob([arrayBuffer]);
        const objectUrl = URL.createObjectURL(blob);
        
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.crossOrigin = "anonymous";
        }
        
        const audio = audioRef.current;
        audio.src = objectUrl;

        const timeUpdateHandler = () => setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        const durationChangeHandler = () => { if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration); };
        const playHandler = () => setIsPlaying(true);
        const pauseHandler = () => setIsPlaying(false);

        audio.addEventListener('durationchange', durationChangeHandler);
        audio.addEventListener('loadedmetadata', durationChangeHandler);
        audio.addEventListener('timeupdate', timeUpdateHandler);
        audio.addEventListener('play', playHandler);
        audio.addEventListener('pause', pauseHandler);
        audio.addEventListener('ended', pauseHandler);

    } catch (err: any) {
        console.error("useAudioWaveform Hatası:", err);
        setError("Ses dosyası analiz edilemedi. (IDM gibi eklentileri kontrol edin)");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const play = useCallback(() => audioRef.current?.play(), []);
  const pause = useCallback(() => audioRef.current?.pause(), []);
  const seekTo = useCallback((percentage: number) => {
      if (audioRef.current && duration > 0) {
          audioRef.current.currentTime = (percentage / 100) * duration;
      }
  }, [duration]);

  useEffect(() => {
    return () => {
        audioRef.current?.pause();
    };
  }, []);

  return { waveform, progress, isPlaying, isLoading, error, duration, loadAudio, play, pause, seekTo };
};