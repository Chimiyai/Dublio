//src/types/modder.ts
import { Prisma } from '@prisma/client';

// Bu, daha önce page.tsx'de olan sorgunun aynısı.
export const projectForModderQuery = {
  include: {
    team: {
      include: { members: { include: { user: { select: { id: true, username: true, profileImage: true } } } } }
    },
    characters: {
      orderBy: { name: 'asc' },
      include: {
        voiceActors: {
          include: { voiceActor: { select: { id: true, username: true, profileImage: true } } }
        }
      }
    },
    assets: {
      orderBy: { id: 'asc' }
    },
  }
} as const;

// Bu tipi artık projenin her yerinden import edebiliriz.
export type ProjectForModderStudio = Prisma.ProjectGetPayload<typeof projectForModderQuery>;