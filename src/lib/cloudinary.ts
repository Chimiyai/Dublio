// src/lib/cloudinary.ts
// Bu dosyanın bir önceki mesajdaki gibi olduğundan emin olun.
// Özellikle null, undefined, / ile başlayan yollar ve tam URL'leri doğru işlemeli.

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; // .env.local'de olmalı
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CloudinaryTransformations {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'scale' | string;
  gravity?: string;
  quality?: string | number;
  format?: 'auto' | 'webp' | 'png' | 'jpg';
}

export function getCloudinaryImageUrlOptimized(
  publicIdOrPath: string | null | undefined,
  transformations: CloudinaryTransformations = {},
  placeholderType?: 'banner' | 'cover' | 'avatar' | null
): string { // Her zaman string dönecek şekilde basitleştirelim, StaticImageData kafa karıştırabilir.
  if (!publicIdOrPath) {
    if (placeholderType === 'banner') return '/images/placeholder-banner.jpg';
    if (placeholderType === 'cover') return '/images/placeholder-cover.jpg';
    if (placeholderType === 'avatar') return '/images/default-avatar.png';
    return '/images/placeholder-banner.jpg'; // Genel varsayılan
  }

  if (publicIdOrPath.startsWith('http://') || publicIdOrPath.startsWith('https://') || publicIdOrPath.startsWith('/')) {
    return publicIdOrPath; // Zaten tam URL veya yerel yol ise direkt döndür
  }

  // Cloudinary Public ID ise URL oluştur
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn("Cloudinary cloud name is not configured. Falling back to placeholder.");
    if (placeholderType === 'banner') return '/images/placeholder-banner.jpg';
    if (placeholderType === 'cover') return '/images/placeholder-cover.jpg';
    return '/images/placeholder-banner.jpg';
  }

  const transParts: string[] = [];
  if (transformations.width) transParts.push(`w_${transformations.width}`);
  if (transformations.height) transParts.push(`h_${transformations.height}`);
  if (transformations.crop) transParts.push(`c_${transformations.crop}`);
  if (transformations.gravity) transParts.push(`g_${transformations.gravity}`);
  if (transformations.quality) transParts.push(`q_${transformations.quality || 'auto'}`);
  if (transformations.format) transParts.push(`f_${transformations.format || 'auto'}`);
  
  const transformString = transParts.join(',');

  return `${CLOUDINARY_BASE_URL}/${transformString ? transformString + '/' : ''}${publicIdOrPath}`;
}