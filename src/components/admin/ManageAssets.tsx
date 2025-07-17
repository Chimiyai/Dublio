// src/components/admin/ManageAssets.tsx

'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { AssetType, Prisma } from '@prisma/client';

// DÜZELTME: Artık 'page.tsx'ten tip import etmiyoruz.
// Component, kendi ihtiyacı olan tipi kendisi tanımlıyor.
// Bu tip, 'page.tsx'in gönderdiği veriyle %100 uyumlu.
type ProjectWithAssets = Prisma.ProjectGetPayload<{
    include: {
        assets: { // Artık doğrudan 'assets'
            include: {
                uploader: { select: { username: true } }
            }
        }
    }
}>;

interface Props {
  initialProject: ProjectWithAssets;
}

export default function ManageAssets({ initialProject }: Props) {
    const router = useRouter();
    const [project, setProject] = useState(initialProject);
    const [file, setFile] = useState<File | null>(null);
    const [assetType, setAssetType] = useState<AssetType>(AssetType.OTHER);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) return toast.error("Lütfen bir dosya seçin.");

        const toastId = toast.loading("Dosya yükleniyor...");
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', assetType);

        try {
            // Bu API rotası, dosyayı yükler ve projeye bağlı yeni bir Asset oluşturur.
            const response = await fetch(`/api/admin/projects/${project.id}/assets`, {
                method: 'POST',
                body: formData,
            });
            const newAsset = await response.json();
            if (!response.ok) throw new Error(newAsset.message || "Asset yüklenemedi.");

            toast.success("Asset başarıyla eklendi!", { id: toastId });
            
            // DÜZELTME: 'assets' dizisini güncelliyoruz.
            setProject(prev => ({
                ...prev,
                assets: [newAsset, ...prev.assets]
            }));

            setFile(null);
            (e.target as HTMLFormElement).reset();

        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '50px', flexDirection: 'column' }}>
            <div>
                <h3>Yeni Asset Yükle</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <select value={assetType} onChange={e => setAssetType(e.target.value as AssetType)}>
                        {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="file" onChange={handleFileChange} required />
                    <button type="submit" disabled={isLoading}>{isLoading ? "Yükleniyor..." : "Yükle"}</button>
                </form>
            </div>
            
            <div>
                {/* DÜZELTME: Veriyi `project.assets`'ten alıyoruz */}
                <h3>Proje Assetleri ({project.assets.length})</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {project.assets.map((asset) => (
                        <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #333' }}>
                            <span>{asset.name} ({asset.type})</span>
                            <button style={{ background: 'darkred' }}>Sil</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}