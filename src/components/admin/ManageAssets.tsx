//src/components/admin/ManageAssets.tsx
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Asset, AssetType, Project } from '@prisma/client';
import { toast } from 'react-hot-toast';

// Sunucu tarafından gelen projenin tipini genişletiyoruz.
type ProjectWithAssets = Project & {
    assets: (Asset & { uploader: { username: string } })[];
};

interface Props {
    initialProject: ProjectWithAssets;
}

export default function ManageAssets({ initialProject }: Props) {
    const [project, setProject] = useState(initialProject);
    const [file, setFile] = useState<File | null>(null);
    const [assetType, setAssetType] = useState<AssetType>(AssetType.OTHER);
    const [isLoading, setIsLoading] = useState(false);
    const [format, setFormat] = useState<string>('UNITY_I2LOC'); // Varsayılan

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };
    const [assetFormats, setAssetFormats] = useState<{ [key: number]: string }>({});

    // --- 1. FONKSİYON: handleSubmit ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Lütfen bir dosya seçin.");
            return;
        }

        setIsLoading(true);
        toast.loading("Dosya yükleniyor ve kaydediliyor...");

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', assetType);

        try {
            const response = await fetch(`/api/admin/projects/${project.id}/assets`, {
                method: 'POST',
                body: formData,
            });

            const newAsset = await response.json();
            toast.dismiss();

            if (!response.ok) {
                throw new Error(newAsset.message || "Asset yüklenemedi.");
            }
            
            toast.success("Asset başarıyla eklendi!");
            setProject(prev => ({
                ...prev,
                assets: [newAsset, ...prev.assets]
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
    // --- handleSubmit BİTTİ ---


    // --- 2. FONKSİYON: handleParseAsset ---
    const handleParseAsset = async (assetId: number) => {
    // Kullanıcının o an seçtiği formatı al.
    // Eğer her asset için ayrı bir format seçimi yaptıracaksak, bu state'i güncellemeliyiz.
    // Şimdilik, formdaki ana dropdown'dan aldığımızı varsayalım.
    const selectedFormat = assetFormats[assetId] || 'UNITY_I2LOC'; // Varsayılan format
    
    toast.loading("Dosya ayrıştırılıyor...");
    try {
        const response = await fetch(`/api/admin/assets/${assetId}/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Body'de formatı gönderiyoruz
            body: JSON.stringify({ format: selectedFormat }) 
        });
            const result = await response.json();
            toast.dismiss();

            if (!response.ok) throw new Error(result.message || "İşlem başarısız.");

            toast.success(result.message);
            window.location.reload();

        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
        }
    };
    // --- handleParseAsset BİTTİ ---

    
    // --- BİLEŞENİN RETURN İFADESİ ---
    return (
        <div style={{ display: 'flex', gap: '50px' }}>
            {/* Asset Yükleme Formu */}
            <div style={{ flex: 1 }}>
                <h3>Yeni Asset Yükle</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <select value={assetType} onChange={e => setAssetType(e.target.value as AssetType)}>
                        <option value="AUDIO">Ses Dosyası</option>
                        <option value="TEXT">Metin Dosyası</option>
                        <option value="IMAGE">Görsel</option>
                        <option value="VIDEO">Video</option>
                        <option value="OTHER">Diğer</option>
                    </select>
                    
                    <input type="file" onChange={handleFileChange} required />
                    <button type="submit" disabled={isLoading} style={{ background: 'purple', padding: '10px' }}>
                        {isLoading ? "Yükleniyor..." : "Yükle ve Kaydet"}
                    </button>
                </form>
            </div>
            
            {/* Mevcut Assetler Listesi */}
            <div style={{ flex: 2, borderLeft: '1px solid #444', paddingLeft: '40px' }}>
                <h3>Proje Assetleri ({project.assets.length})</h3>
                {project.assets.map(asset => (
                    <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #333', alignItems: 'center' }}>
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
                  disabled={!assetFormats[asset.id]} // Format seçilmeden butonu pasif yap
                  style={{background: 'darkblue'}}
                >
                  İşle
                </button>
              </>
            )}
            <button style={{background: 'darkred'}}>Sil</button>
        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}