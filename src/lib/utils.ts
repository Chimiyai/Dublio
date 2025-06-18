// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RoleInProject } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatReportStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Beklemede';
    case 'reviewed':
      return 'İnceleniyor';
    case 'resolved':
      return 'Çözüldü';
    default:
      // Beklenmedik bir durum olursa, kelimeyi büyük harfle başlatıp döndür
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function formatDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string { // Artık string | null yerine string dönmesi daha tutarlı
  if (!dateInput) {
    return "Tarih Bilinmiyor";
  }
  
  try {
    // Gelen input zaten bir Date objesi mi, yoksa bir string mi diye kontrol et
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

    if (isNaN(date.getTime())) {
      return "Geçersiz Tarih";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long', // veya 'short'
      year: 'numeric',
    };

    return new Intl.DateTimeFormat('tr-TR', { ...defaultOptions, ...options }).format(date);
  } catch (error) {
    return "Hatalı Tarih";
  }
}

export function formatProjectRole(role: RoleInProject): string {
  switch (role) {
    case RoleInProject.VOICE_ACTOR:
      return 'Seslendirme Sanatçısı';
    case RoleInProject.MIX_MASTER:
      return 'Mix & Mastering';
    case RoleInProject.MODDER:
      return 'Mod Geliştiricisi';
    case RoleInProject.TRANSLATOR:
      return 'Çevirmen';
    case RoleInProject.SCRIPT_WRITER:
      return 'Senaryo Yazarı';
    case RoleInProject.DIRECTOR:
      return 'Yönetmen / Prodüktör';
    // RoleInProject enum'unda başka roller varsa, onları da buraya ekle
    default:
      // Bu default case'e normalde girilmemesi beklenir eğer tüm enum üyeleri yukarıda handle edildiyse.
      // Ancak, bir fallback olarak string manipülasyonu yapabiliriz.
      // 'role' değişkeninin 'string' olduğunu varsaymak için bir kontrol veya cast yapabiliriz.
      // Ya da, buraya gelinirse bilinmeyen bir rol olduğunu belirten bir ifade döndürebiliriz.
      const exhaustiveCheck: never = role; // Bu satır, eğer tüm case'ler handle edilmediyse derleme hatası verir.
                                         // Eğer bu satır hata veriyorsa, yukarıdaki switch'e eksik case ekleyin.
                                         // Eğer bu satır hata VERMİYORSA, default case'e teorik olarak ulaşılamaz.
                                         // Pratikte enum'a yeni değer eklenip switch güncellenmezse diye bir fallback iyidir.
      
      // Güvenli string çevrimi ve formatlama:
      let roleString = String(role); // role'ü güvenli bir şekilde string'e çevir
      return roleString
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char: string) => char.toUpperCase()); // char'a string tipi ver
  }
}