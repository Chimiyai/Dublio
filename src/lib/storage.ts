import { Asset } from '@prisma/client';

// Bu fonksiyon, asset'in nereden geldiğine bakmaksızın ona erişilebilir URL'i döndürür.
export function getAssetUrl(asset: Asset): string {
    // ŞİMDİLİK: Sadece yerel public yolunu döndür.
    // Gelecekte burası çok daha karmaşık olacak.
    if (asset.path.startsWith('/')) {
        return asset.path;
    }
    
    // GELECEKTE EKLENECEK MANTIK:
    // if (storage.provider === 'GOOGLE_DRIVE') {
    //     return getGoogleDriveDownloadUrl(asset.path, storage.config.accessToken);
    // }
    // if (storage.provider === 'AWS_S3') {
    //     return getS3PresignedUrl(asset.path);
    // }
    
    // Varsayılan olarak yolu döndür (hatalı durum)
    return asset.path;
}