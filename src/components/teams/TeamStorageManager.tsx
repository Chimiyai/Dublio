// src/components/teams/TeamStorageManager.tsx

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Team, TeamStorage, AssetType, Prisma } from '@prisma/client';

type TeamWithStorages = Prisma.TeamGetPayload<{
    include: { storages: true }
}>

interface Props {
  team: TeamWithStorages;
}

// Önceden tanımlanmış sağlayıcılar
const PREDEFINED_PROVIDERS = {
    GOOGLE_DRIVE: "Google Drive (Önerilen)",
    ONEDRIVE: "Microsoft OneDrive",
    DROPBOX: "Dropbox",
    OTHER: "Diğer..."
};

export default function TeamStorageManager({ team }: Props) {
    const router = useRouter();
    const [storages, setStorages] = useState<TeamStorage[]>(team.storages);
    const [isLoading, setIsLoading] = useState(false);

    // Form state'leri
    const [name, setName] = useState('');
    // DÜZELTME: `provider` state'i artık seçilen anahtarı tutacak (örn: "GOOGLE_DRIVE")
    const [providerSelection, setProviderSelection] = useState('GOOGLE_DRIVE');
    // "Diğer" seçildiğinde görünecek metin kutusu için state
    const [customProvider, setCustomProvider] = useState('');
    const [configUrl, setConfigUrl] = useState('');
    const [selectedAssetTypes, setSelectedAssetTypes] = useState<Set<AssetType>>(new Set());

    const handleTypeChange = (type: AssetType) => {
        setSelectedAssetTypes(prev => {
            const newSet = new Set(prev);
            newSet.has(type) ? newSet.delete(type) : newSet.add(type);
            return newSet;
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // DÜZELTME: `provider`'ın son değerini belirle
        const finalProvider = providerSelection === 'OTHER' ? customProvider : providerSelection;

        if (!name || !configUrl || !finalProvider || selectedAssetTypes.size === 0) {
            return toast.error("Tüm alanları doldurun ve en az bir dosya türü seçin.");
        }

        setIsLoading(true);
        toast.loading("Depolama alanı ekleniyor...");

        try {
            const response = await fetch(`/api/teams/${team.id}/storages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    provider: finalProvider, // Veritabanına son değeri gönder
                    config: { url: configUrl },
                    assetTypes: Array.from(selectedAssetTypes).join(','),
                }),
            });
            
            const newStorage = await response.json();
            toast.dismiss();

            if (!response.ok) throw new Error(newStorage.message || "Depolama alanı eklenemedi.");

            toast.success("Depolama alanı başarıyla eklendi!");
            setStorages(prev => [...prev, newStorage]);
            
            // Formu temizle
            setName('');
            setConfigUrl('');
            setProviderSelection('GOOGLE_DRIVE');
            setCustomProvider('');
            setSelectedAssetTypes(new Set());

        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '50px' }}>
            {/* Yeni Ekleme Formu */}
            <div style={{ flex: 1 }}>
                <h3>Yeni Depolama Alanı Ekle</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Depolama Adı (örn: Ana Drive)" value={name} onChange={e => setName(e.target.value)} required />
                    
                    {/* DÜZELTME: Sağlayıcı için Select Menüsü */}
                    <select value={providerSelection} onChange={e => setProviderSelection(e.target.value)}>
                        {Object.entries(PREDEFINED_PROVIDERS).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>

                    {/* "Diğer" seçilirse görünecek metin kutusu */}
                    {providerSelection === 'OTHER' && (
                        <input 
                            type="text" 
                            placeholder="Sağlayıcı Adını Girin (örn: pCloud)" 
                            value={customProvider} 
                            onChange={e => setCustomProvider(e.target.value)} 
                            required 
                        />
                    )}

                    <input type="url" placeholder="Paylaşım Linki (Değiştirme İzinli)" value={configUrl} onChange={e => setConfigUrl(e.target.value)} required />
                    
                    <div>
                        <p>Desteklenen Dosya Türleri:</p>
                        {Object.values(AssetType).map(type => (
                            <label key={type} style={{ marginRight: '15px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedAssetTypes.has(type)}
                                    onChange={() => handleTypeChange(type)}
                                /> {type}
                            </label>
                        ))}
                    </div>

                    <button type="submit" disabled={isLoading}>{isLoading ? 'Ekleniyor...' : 'Ekle'}</button>
                </form>
            </div>
            
            {/* Mevcut Depolama Alanları */}
            <div style={{ flex: 2 }}>
                <h3>Mevcut Depolama Alanları ({storages.length})</h3>
                {storages.map(storage => (
                    <div key={storage.id} style={{ background: '#2a2a2a', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                        <p><strong>{storage.name}</strong> ({storage.provider})</p>
                        <p>Desteklenen Türler: {storage.assetTypes}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}