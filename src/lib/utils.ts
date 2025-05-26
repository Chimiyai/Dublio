// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { RoleInProject } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tarih formatlama fonksiyonu
export function formatDate(dateStringOrDate: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string | null {
  if (!dateStringOrDate) {
    return null;
  }
  try {
    const date = new Date(dateStringOrDate);
    // Tarihin geçerli olup olmadığını kontrol et
    if (isNaN(date.getTime())) {
        // console.error("Invalid date for formatDate (parsed as NaN):", dateStringOrDate);
        return "Bilinmiyor"; // veya null ya da özel bir mesaj
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat('tr-TR', options || defaultOptions).format(date);
  } catch (error) {
    // console.error("Error formatting date:", dateStringOrDate, error);
    return "Hatalı Tarih"; // veya null
  }
}

// Diğer yardımcı fonksiyonlarınız varsa burada kalabilir
// Örnek:
// export const slugify = (text: string): string => { ... }
// export const formatProjectRole = (role: string): string => { ... }

export function formatProjectRole(role: RoleInProject | string): string {
  const roleString = role.toString();
  const roleMap: { [key: string]: string } = { // key string olabilir
    VOICE_ACTOR: 'Seslendirme Sanatçısı',
    MIX_MASTER: 'SFX/VFX',
    MODDER: 'Mod Geliştiricisi',
    TRANSLATOR: 'Çevirmen',
    SCRIPT_WRITER: 'Senaryo Yazarı',
    DIRECTOR: 'Prodüktör',
    // Prisma şemandaki RoleInProject enum'undaki TÜM değerleri buraya ekle
  };
  // Eşleşme yoksa, alt çizgiyi boşlukla değiştir ve baş harfleri büyüt
  return roleMap[roleString] || roleString.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}