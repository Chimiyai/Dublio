// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { RoleInProject } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatProjectRole(role: RoleInProject | string): string {
  const roleString = role.toString();
  const roleMap: { [key: string]: string } = { // key string olabilir
    VOICE_ACTOR: 'Seslendirme Sanatçısı',
    MIX_MASTER: 'Mix/Mastering Uzmanı',
    MODDER: 'Mod Yapımcısı',
    TRANSLATOR: 'Çevirmen',
    SCRIPT_WRITER: 'Senaryo Yazarı',
    DIRECTOR: 'Yönetmen',
    // Prisma şemandaki RoleInProject enum'undaki TÜM değerleri buraya ekle
  };
  // Eşleşme yoksa, alt çizgiyi boşlukla değiştir ve baş harfleri büyüt
  return roleMap[roleString] || roleString.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}