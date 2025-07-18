// src/lib/parsers/index.ts

import { parseUnityI2Localization } from './unity-i2loc-parser';
// import { parseUnrealLocres } from './unreal-locres-parser'; // Gelecekte bunu da eklersin

type ParserFunction = (fileContent: string) => Promise<{ key: string, originalText: string }[]>;

const parsers: Record<string, ParserFunction> = {
  UNITY_I2: parseUnityI2Localization,
  // UNREAL_LOCRES: parseUnrealLocres,
};

export function getParser(format: string): ParserFunction | null {
  return parsers[format] || null;
}
