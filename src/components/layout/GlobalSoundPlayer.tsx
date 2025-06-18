// src/components/layout/GlobalSoundPlayer.tsx
'use client';

import { useEffect, useCallback, useRef } from 'react';

// Gelen prop'un tipi
interface SoundData {
  name: string;
  data: string;
}

interface GlobalSoundPlayerProps {
  soundFilesData: SoundData[];
}

export default function GlobalSoundPlayer({ soundFilesData }: GlobalSoundPlayerProps) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
  }, []);

  const playRandomSound = useCallback(async () => {
    const audioContext = audioContextRef.current;
    if (!audioContext || !soundFilesData || soundFilesData.length === 0) return;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    try {
      // 1. Rastgele bir ses objesi seç
      const randomIndex = Math.floor(Math.random() * soundFilesData.length);
      const randomSound = soundFilesData[randomIndex];

      // 2. FETCH'İ KALDIRDIK! Base64 verisini doğrudan ArrayBuffer'a çeviriyoruz.
      const response = await fetch(randomSound.data); // Data URL'ini fetch etmek en kolay yoldur
      const arrayBuffer = await response.arrayBuffer();
      
      // 3. Ses verisini decode et
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 4. Kaynak ve efektleri oluştur (bu kısım aynı)
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Hem pitch (detune) hem de hızı (playbackRate) rastgele ayarlayalım
      source.detune.value = (Math.random() * 2400) - 1200; // -1 ve +1 oktav arası
      source.playbackRate.value = 0.8 + Math.random() * 0.7; // 0.8 ile 1.5 arası hız

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.7;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      source.start(0);

    } catch (error) {
      console.error("Web Audio API hatası (Base64 ile):", error);
    }
  }, [soundFilesData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.key.toLowerCase() === 'j' &&
        !target.isContentEditable &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
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