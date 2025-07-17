// src/components/admin/ManageAssets.tsx
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Asset, AssetType } from '@prisma/client';
import { toast } from 'react-hot-toast';

// DÜZELTME: Sunucudan gelen yeni tipi import ediyoruz.
// Bu, `.../duzenle/[projectId]/page.tsx` dosyasında tanımladığımız tiptir.
import { type ProjectForAdmin } from '@/app/admin/projeler/duzenle/[projectId]/page';

interface Props {
    initialProject: ProjectForAdmin;
}

export default function ManageAssets({ initialProject }: Props) {
    // === STATE'LER ===
    const [project, setProject] = useState(initialProject);
    const [file, setFile] = useState<File | null>(null);
    const [assetType, setAssetType] = useState<AssetType>(AssetType.OTHER);
    const [isLoading, setIsLoading] = useState(false);
    // Her asset için ayrı format state'i tutuyoruz, bu doğru.
    const [assetFormats, setAssetFormats] = useState<{ [key: number]: string }>({});

    // === FONKSİYONLAR ===

    const handleSyncAssets = async () => {
        toast.loading("Content assetleri projeyle senkronize ediliyor...");
        try {
            // Bu yeni API rotasını çağıracağız
            const res = await fetch(`/api/admin/projects/${initialProject.id}/sync-assets`, {
                method: 'POST'
            });
            const result = await res.json();
            toast.dismiss();

            if (!res.ok) throw new Error(result.message || "Senkronizasyon başarısız.");

            toast.success(`${result.createdCount} yeni asset ayarı eklendi!`);
            window.location.reload(); // En basit çözüm, sayfayı yenilemek.

        } catch(error: any) {
            toast.dismiss();
            toast.error(error.message);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) return toast.error("Lütfen bir dosya seçin.");

        setIsLoading(true);
        toast.loading("Dosya yükleniyor...");

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', assetType);
        // DİKKAT: Asset'i artık doğrudan projeye değil, content'e bağlıyoruz.
        // `initialProject` objesinden `contentId`'yi almamız gerek.
        // Şimdilik, bu bilginin `initialProject`'te olduğunu varsayıyoruz. 
        // Eğer yoksa, `page.tsx`'den `contentId`'yi de göndermeniz gerekir.
        // formData.append('contentId', project.contentId.toString());

        try {
            // Bu API rotası asset'i oluşturur ve proje için ayarını da yapar.
            const response = await fetch(`/api/admin/projects/${project.id}/assets`, {
                method: 'POST',
                body: formData,
            });

            const newProjectAssetSetting = await response.json();
            toast.dismiss();

            if (!response.ok) {
                throw new Error(newProjectAssetSetting.message || "Asset yüklenemedi.");
            }
            
            toast.success("Asset başarıyla eklendi ve projeye bağlandı!");
            
            // DÜZELTME: Artık 'assets' dizisini değil, 'projectAssetSettings' dizisini güncelliyoruz.
            setProject((prev: ProjectForAdmin) => ({
                ...prev,
                projectAssetSettings: [newProjectAssetSetting, ...prev.projectAssetSettings]
            }));

            setFile(null);
            (e.target as HTMLFormElement).reset();

        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleParseAsset = async (assetId: number) => {
        const selectedFormat = assetFormats[assetId];
        if (!selectedFormat) return toast.error("Lütfen bir format seçin.");
        
        toast.loading("Dosya ayrıştırılıyor...");
        try {
            const response = await fetch(`/api/admin/assets/${assetId}/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // DÜZELTME: `projectId`'yi de body'de gönderiyoruz.
                body: JSON.stringify({ 
                    format: selectedFormat,
                    projectId: project.id 
                }) 
            });
            const result = await response.json();
            toast.dismiss();

            if (!response.ok) throw new Error(result.message || "İşlem başarısız.");

            toast.success(result.message);
            // Sayfayı yenilemek yerine state'i güncelleyebiliriz, ama yenilemek en basit çözüm.
            window.location.reload();

        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
        }
    };
    
    // === RENDER ===
    return (
        <div style={{ display: 'flex', gap: '50px' }}>
            {/* Asset Yükleme Formu */}
            <div style={{ flex: 1 }}>
                <h3>Yeni Asset Yükle</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Form elemanları aynı kalabilir */}
                </form>
            </div>
            
            {/* Mevcut Assetler Listesi */}
             <div style={{ flex: 2, borderLeft: '1px solid #444', paddingLeft: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Proje Assetleri ({project.projectAssetSettings.length})</h3>
                    {/* YENİ BUTON */}
                    <button onClick={handleSyncAssets} style={{ background: 'darkgreen', padding: '5px 10px' }}>
                        Content ile Senkronize Et
                    </button>
                </div>
                <h3>Proje Assetleri ({project.projectAssetSettings.length})</h3>
                {/* DÜZELTME: `setting` parametresine tip ekliyoruz. */}
                {project.projectAssetSettings.map((setting) => {
                    const asset = setting.asset;
                    
                    return (
                        <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #333', alignItems: 'center' }}>
                            <div>
                                <p><strong>{asset.name}</strong></p>
                                <small>Yükleyen: {asset.uploader.username} | Tip: {asset.type}</small>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {asset.type === 'TEXT' && (
                                    <>
                                        <select 
                                            value={assetFormats[asset.id] || ''}
                                            onChange={(e) => setAssetFormats(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                        >
                                            <option value="">Format Seç...</option>
                                            <option value="UNITY_I2LOC">Unity I2 JSON</option>
                                            <option value="UNREAL_LOCRES">Unreal Locres</option>
                                        </select>
                                        <button 
                                            onClick={() => handleParseAsset(asset.id)} 
                                            disabled={!assetFormats[asset.id]}
                                            style={{ background: 'darkblue', padding: '5px 10px' }}
                                        >
                                            İşle
                                        </button>
                                    </>
                                )}
                                <button style={{ background: 'darkred', padding: '5px 10px' }}>Sil</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}