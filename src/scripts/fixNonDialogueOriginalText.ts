// scripts/fixNonDialogueOriginalText.ts
import prisma from '../lib/prisma';

async function main() {
  const lines = await prisma.translationLine.findMany({
    where: {
      isNonDialogue: true,
      originalText: null,
      characterId: { not: null }
    },
    include: { character: true }
  });

  for (const line of lines) {
    const characterName = line.character?.name || 'Bilinmeyen';
    await prisma.translationLine.update({
      where: { id: line.id },
      data: {
        originalText: `Karaktere özel efekt: ${characterName}`
      }
    });
    console.log(`Güncellendi: ${line.id} - ${characterName}`);
  }
}

main().then(() => {
  console.log('Tüm eski diyalogsuz satırlar güncellendi.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});