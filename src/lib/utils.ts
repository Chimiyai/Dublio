// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { RoleInProject } from "@prisma/client"; // Prisma enum'unu import et

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// YENİ MERKEZİ formatRole FONKSİYONU
export function formatProjectRole(role: RoleInProject | string): string {
  const roleString = role.toString(); // Gelen değer enum veya string olabilir

  const roleMap: { [key in RoleInProject | string]?: string } = {
    VOICE_ACTOR: 'Seslendirme Sanatçısı',
    MIX_MASTER: 'Mix/Mastering Uzmanı', // Veya sadece "Mix Master"
    MODDER: 'Mod Yapımcısı',
    TRANSLATOR: 'Çevirmen',
    SCRIPT_WRITER: 'Senaryo Yazarı',
    DIRECTOR: 'Yönetmen',
    // prisma/schema.prisma dosyasındaki RoleInProject enum'undaki TÜM değerler için buraya Türkçe karşılıklarını ekle.
    // Örnek:
    // EDITOR: 'Video Editörü',
    // PROOFREADER: 'Redaktör',
  };

  return roleMap[roleString] || roleString.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}