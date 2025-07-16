//src/lib/parsers/unity-i2loc-parser.ts
// Bu fonksiyon, spesifik bir JSON formatını işler.
export async function parseUnityI2Localization(fileContent: string): Promise<{ key: string, originalText: string }[]> {
    const data = JSON.parse(fileContent);
    const lines: { key: string, originalText: string }[] = [];
    const terms = data?.mTerms?.Array || [];

    for (const termObject of terms) {
        const key = termObject?.Term;
        const languages = termObject?.Languages?.Array;
        if (key && languages && languages.length > 0) {
            lines.push({ key, originalText: languages[0] });
        }
    }
    return lines;
}