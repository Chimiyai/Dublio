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

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

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
                body: formData, // FormData gönderirken header belirtmeye gerek yok
            });

            const newAsset = await response.json();
            toast.dismiss();

            if (!response.ok) {
                throw new Error(newAsset.message || "Asset yüklenemedi.");
            }
            
            toast.success("Asset başarıyla eklendi!");
            // Liste anında güncellensin diye state'i set ediyoruz
            setProject(prev => ({
                ...prev,
                assets: [newAsset, ...prev.assets]
            }));
            // Formu temizle
            setFile(null);
            // Input'u programatik olarak temizlemek için:
            (e.target as HTMLFormElement).reset();

        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
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
                    <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #333' }}>
                        <div>
                            <a href={asset.path} target="_blank" rel="noopener noreferrer" style={{color: 'lightblue'}}>{asset.name}</a>
                            <small style={{display: 'block', color: '#888'}}>Tür: {asset.type} | Yükleyen: {asset.uploader.username}</small>
                        </div>
                        <button style={{background: 'darkred'}}>Sil</button>
                    </div>
                ))}
            </div>
        </div>
    );
}