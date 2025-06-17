// src/components/layout/GlobalSoundPlayer.tsx
'use client';

import { useEffect, useCallback, useRef } from 'react';

interface GlobalSoundPlayerProps {
  soundFiles: string[];
}

export default function GlobalSoundPlayer({ soundFiles }: GlobalSoundPlayerProps) {
  // Web Audio API'nin ana kontrolcüsü olan AudioContext'i bir kere oluşturup tekrar kullanacağız.
  // useRef ile saklıyoruz ki her render'da yeniden oluşmasın.
  const audioContextRef = useRef<AudioContext | null>(null);

  // Component ilk yüklendiğinde AudioContext'i oluştur.
  useEffect(() => {
    // `window.AudioContext` tarayıcıya özel bir API olduğu için `window` kontrolü yaparız.
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
  }, []);

  const playRandomSound = useCallback(async () => {
    const audioContext = audioContextRef.current;
    if (!audioContext || !soundFiles || soundFiles.length === 0) {
      return;
    }

    // AudioContext'in askıya alınmış durumdan çıkması için (tarayıcı politikaları)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    try {
      // 1. Rastgele bir ses dosyası seç
      const randomIndex = Math.floor(Math.random() * soundFiles.length);
      const randomSoundSrc = soundFiles[randomIndex];
      
      // 2. Ses dosyasını fetch ile çek ve veriyi ArrayBuffer olarak al
      const response = await fetch(randomSoundSrc);
      const arrayBuffer = await response.arrayBuffer();

      // 3. Ses verisini Web Audio API'nin anlayacağı formata (AudioBuffer) dönüştür
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 4. Bu ses verisi için bir kaynak düğümü (source node) oluştur
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // --- YENİ VE DOĞRU PITCH DEĞİŞİKLİĞİ ---
      const minPitch = 0.3; // En pes
      const maxPitch = 2;  // En tiz
      const randomPlaybackRate = Math.random() * (maxPitch - minPitch) + minPitch;
      
      // Kaynak düğümünün çalma hızını ayarla. Bu, yüksek kaliteli bir pitch shifting efekti yaratır.
      source.playbackRate.value = randomPlaybackRate;
      // -----------------------------------------

      // (Opsiyonel) Ses seviyesini kontrol etmek için bir GainNode ekleyebiliriz
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.7; // Ses seviyesini %70 yap

      // Kaynağı -> Ses Seviyesi Kontrolcüsüne -> Hoparlöre bağla
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 5. Sesi çalmaya başla
      source.start(0);

    } catch (error) {
      console.error("Web Audio API ile ses çalınırken hata:", error);
    }
  }, [soundFiles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ... (bu kısım aynı)
      const target = event.target as HTMLElement;
      if (
        event.key.toLowerCase() === 'j' &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !target.isContentEditable
      ) {
        event.preventDefault();
        playRandomSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playRandomSound]);

  return null;
}