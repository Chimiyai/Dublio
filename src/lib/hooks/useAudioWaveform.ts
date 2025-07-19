//src/lib/hooks/useAudioWaveform.ts
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

interface UseAudioWaveformReturn {
  waveform: number[];
  progress: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  duration: number;
  audioBuffer: AudioBuffer | null; // audioBuffer'ı dışarıya veriyoruz
  loadAudio: (source: string | ArrayBuffer | Blob) => void; // Kaynak tipi genişletildi
  play: () => void;
  pause: () => void;
  seekTo: (percentage: number) => void;
}

// === HOOK'UN SON HALİ ===
export const useAudioWaveform = (): UseAudioWaveformReturn => {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  // YENİ: AudioBuffer'ı state olarak tutuyoruz
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // DÜZELTME: loadAudio artık farklı kaynak türlerini kabul ediyor
  const loadAudio = useCallback(async (source: string | ArrayBuffer | Blob) => {
    setIsLoading(true);
    setError(null);
    setWaveform([]);
    setProgress(0);
    setAudioBuffer(null); // Başlangıçta buffer'ı temizle
    
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
    }

    let arrayBuffer: ArrayBuffer;
    let objectUrlForPlayback: string;

    try {
        if (typeof source === 'string') {
            if (source.startsWith('data:')) {
                // Senaryo 1: Kaynak bir Data URI
                const parts = source.split(',');
                const base64Data = parts[1];
                const binaryString = window.atob(base64Data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
                arrayBuffer = bytes.buffer;
                objectUrlForPlayback = source;
            } else {
                // Senaryo 2: Kaynak bir URL
                const response = await fetch(source, { mode: 'cors' });
                if (!response.ok) throw new Error(`Ses dosyası yüklenemedi (HTTP ${response.status})`);
                arrayBuffer = await response.arrayBuffer();
                const blob = new Blob([arrayBuffer]);
                objectUrlForPlayback = URL.createObjectURL(blob);
            }
        } else if (source instanceof Blob) {
            // Senaryo 3: Kaynak bir Blob
            arrayBuffer = await source.arrayBuffer();
            objectUrlForPlayback = URL.createObjectURL(source);
        } else {
            // Senaryo 4: Kaynak bir ArrayBuffer
            arrayBuffer = source;
            const blob = new Blob([arrayBuffer]);
            objectUrlForPlayback = URL.createObjectURL(blob);
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        
        const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer.slice(0));
        setAudioBuffer(decodedBuffer); // YENİ: State'i ayarla

        const filteredData = processAudioBuffer(decodedBuffer, 120);
        setWaveform(filteredData);

        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.crossOrigin = "anonymous";
        }
        const audio = audioRef.current;
        audio.src = objectUrlForPlayback;
        
        // Olay dinleyicileri
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
        setError("Ses dosyası analiz edilemedi.");
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

  // DÜZELTME: audioBuffer'ı da döndür
  return { waveform, progress, isPlaying, isLoading, error, duration, audioBuffer, loadAudio, play, pause, seekTo };
};
