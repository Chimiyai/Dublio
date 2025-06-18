// src/app/api/sounds/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs'; // Sunucuda dosya okumak için Node.js'in dosya sistemi modülü
import path from 'path'; // Sunucuda dosya yollarını birleştirmek için Node.js'in yol modülü

export async function GET() {
  try {
    // Projenin ana dizininden public/sounds klasörüne giden yolu oluştur
    const soundsDirectory = path.join(process.cwd(), 'public', 'sounds');
    
    // Bu dizindeki tüm dosya adlarını oku (örn: ["1.mp3", "baka.wav"])
    const filenames = fs.readdirSync(soundsDirectory);

    // Sadece desteklenen ses dosyalarını filtrele ve URL formatına çevir
    const soundFiles = filenames
      .filter(file => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg'))
      .map(file => `/sounds/${file}`); // Tarayıcının anlayacağı yola çevir (örn: "/sounds/1.mp3")

    // Bulunan dosya listesini JSON olarak döndür
    return NextResponse.json(soundFiles);

  } catch (error) {
    console.error("API /api/sounds - Ses dosyaları okunurken hata:", error);
    // Hata durumunda boş bir dizi ve 500 sunucu hatası kodu döndür
    return NextResponse.json({ message: "Ses dosyaları bulunamadı." }, { status: 500 });
  }
}