// src/lib/parsers/index.ts

import { parseUnityI2Localization } from './unity-i2loc-parser';
import { parseUnrealLocres } from './unreal-locres-parser';

// Yeni: Basit TXT dosyaları için bir parser fonksiyonu
// Şimdilik boş, gelecekte doldurulacak.
async function parseSimpleTxt(fileContent: string): Promise<{ key: string, originalText: string }[]> {
    console.log("Simple TXT parser henüz implemente edilmedi.");
    // Örnek: Her satırı bir key ve value olarak ayırabilir.
    // "key=value" formatı için:
    /*
    const lines = fileContent.split('\n').map(line => {
        const parts = line.split('=');
        if (parts.length === 2) {
            return { key: parts[0].trim(), originalText: parts[1].trim() };
        }
        return null;
    }).filter(Boolean);
    return lines as { key: string, originalText: string }[];
    */
    return [];
}


// Format isimlerini standartlaştıralım.
export type ParserFormat = 'UNITY_I2LOC' | 'UNREAL_LOCRES' | 'SIMPLE_TXT';

// === ÇÖZÜM BURADA ===
// `parsers` objemize eksik olan `SIMPLE_TXT` anahtarını ekliyoruz.
export const parsers: { [key in ParserFormat]: (content: any) => Promise<{ key: string, originalText: string }[]> } = {
    'UNITY_I2LOC': parseUnityI2Localization,
    'UNREAL_LOCRES': parseUnrealLocres,
    'SIMPLE_TXT': parseSimpleTxt, // <-- EKSİK PARÇAYI EKLEDİK
};

// Bu fonksiyon, dosya içeriğine veya adına bakarak formatı tahmin etmeye çalışabilir.
// VEYA adminin formatı manuel seçmesini sağlayabiliriz.
export function detectFormat(filename: string): ParserFormat | null {
    if (filename.endsWith('.json')) return 'UNITY_I2LOC'; // Basit bir varsayım
    if (filename.endsWith('.locres')) return 'UNREAL_LOCRES';
    return null;
}