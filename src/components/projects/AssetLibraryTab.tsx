//src/components/projects/AssetLibraryTab.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Asset, AssetType } from '@prisma/client';

interface AssetLibraryTabProps {
  projectId: number;
  onParseSuccess: () => void;
}

export const AssetLibraryTab: React.FC<AssetLibraryTabProps> = ({ projectId, onParseSuccess }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTypeFilter, setActiveTypeFilter] = useState<AssetType | 'ALL'>('ALL');

  const fetchAssets = useCallback(async (type: AssetType | 'ALL') => {
    setIsLoading(true);
    let url = `/api/projects/${projectId}/assets`;
    if (type !== 'ALL') {
      url += `?type=${type}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Asset'ler getirilemedi.");
      const data = await res.json();
      setAssets(data.assets);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAssets(activeTypeFilter);
  }, [activeTypeFilter, fetchAssets]);

  const handleParse = async (assetId: number) => {
    const toastId = toast.loading("Metin dosyası ayrıştırılıyor...");
    try {
        const res = await fetch(`/api/assets/${assetId}/parse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // YENİ: Hangi formatı kullanacağımızı API'ye bildiriyoruz.
            body: JSON.stringify({ format: 'UNITY_I2' }), 
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Ayrıştırma başarısız.");
        }
        const result = await res.json();
        toast.success(`${result.count} adet çeviri satırı oluşturuldu!`, { id: toastId });
        onParseSuccess();
    } catch (error: any) {
        toast.error(error.message, { id: toastId });
    }
  };
  
  const filterButtons = (['ALL', ...Object.values(AssetType)] as const).map(type => (
    <button
      key={type}
      onClick={() => setActiveTypeFilter(type)}
      style={{
        background: activeTypeFilter === type ? 'purple' : 'transparent',
        color: 'white',
        border: '1px solid purple',
        padding: '8px 12px',
        cursor: 'pointer',
      }}
    >
      {type === 'ALL' ? 'Tümü' : type}
    </button>
  ));

  return (
    <div>
      <h3>Asset Kütüphanesi</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {filterButtons}
      </div>

      {isLoading ? (
        <p>Asset'ler yükleniyor...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #555' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>İsim</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Tür</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px' }}>{asset.id}</td>
                <td style={{ padding: '8px' }}>{asset.name}</td>
                <td style={{ padding: '8px' }}>{asset.type}</td>
                <td style={{ textAlign: 'right', padding: '8px' }}>
                  {asset.type === 'TEXT' && (
                    <button onClick={() => handleParse(asset.id)}>Ayrıştır</button>
                  )}
                  <a href={asset.path} target="_blank" rel="noopener noreferrer" style={{marginLeft: '10px'}}>Görüntüle</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};