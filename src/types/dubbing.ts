// src/types/dubbing.ts

import { Prisma, TranslationLine } from "@prisma/client";

// En basit tip tanımı: doğrudan Prisma'dan gelen TranslationLine tipini kullan
// Bu tip, schema.prisma'daki tüm skaler alanları (voiceRecordingUrl dahil) içerir.
export type LineForDubbing = TranslationLine;

// Eğer gelecekte özel select'ler kullanmak istersek, o zaman:
// export type LineForDubbing = Prisma.TranslationLineGetPayload<{
//     select: {
//         id: true;
//         assetId: true;
//         key: true;
//         originalText: true;
//         translatedText: true;
//         status: true;
//         notes: true;
//         voiceRecordingUrl: true; // Burada olması gereken alan
//     }
// }>;