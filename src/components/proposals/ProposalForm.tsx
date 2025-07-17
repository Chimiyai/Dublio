// src/components/proposals/ProposalForm.tsx

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Content, AssetType } from '@prisma/client';
import { type TeamsWithStorages } from '@/app/teklif-ver/[slug]/page';

interface Props {
  content: Content;
  teams: TeamsWithStorages;
}

// Hangi dosya türünün hangi depolamaya gideceğini tutan state'in tipi
type StorageMapping = {
  [key in AssetType]?: string; // Örn: { AUDIO: "1", TEXT: "2" }
};

export default function ProposalForm({ content, teams }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form state'leri
    const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id.toString() || '');
    const [message, setMessage] = useState('');
    const [storageMapping, setStorageMapping] = useState<StorageMapping>({});
    
    // Seçili ekibin depolama seçeneklerini tutan state
    const [availableStorages, setAvailableStorages] = useState(teams[0]?.storages || []);

    // Kullanıcı ekip değiştirdiğinde, depolama seçeneklerini güncelle
    useEffect(() => {
        const selectedTeam = teams.find(t => t.id.toString() === selectedTeamId);
        setAvailableStorages(selectedTeam?.storages || []);
        // Ekip değiştiğinde haritalamayı sıfırla
        setStorageMapping({});
    }, [selectedTeamId, teams]);

    const handleMappingChange = (assetType: AssetType, storageId: string) => {
        setStorageMapping(prev => ({
            ...prev,
            [assetType]: storageId,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        // Tüm asset tipleri için bir depolama seçildi mi kontrol et
        const allTypesAssigned = Object.values(AssetType).every(type => storageMapping[type]);
        if (!selectedTeamId || !allTypesAssigned) {
            return toast.error("Lütfen bir ekip seçin ve tüm dosya türleri için bir depolama alanı atayın.");
        }

        setIsLoading(true);
        toast.loading("Teklif gönderiliyor...");

        try {
            const response = await fetch('/api/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: parseInt(selectedTeamId),
                    contentId: content.id,
                    message,
                    storageMapping, // JSON objesini doğrudan gönderiyoruz
                }),
            });
            
            const responseData = await response.json();
            toast.dismiss();

            if (!response.ok) throw new Error(responseData.message || "Teklif gönderilemedi.");

            toast.success("Teklifiniz başarıyla Admin'e iletildi!");
            router.push('/icerikler'); // Tekrar içerik listesine yönlendir
            router.refresh();

        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#1c1c1c', padding: '20px', borderRadius: '8px' }}>
            <div>
                <label>Hangi Ekip Adına Teklif Verilecek?</label>
                <select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)}>
                    {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
            </div>

            <hr />
            <h3>Depolama Alanı Atamaları</h3>
            <p style={{ color: '#aaa', marginTop: '-15px' }}>
                Projenin farklı türdeki dosyalarının hangi depolama alanına kaydedileceğini seçin.
            </p>

            {Object.values(AssetType).map(type => (
                <div key={type}>
                    <label>{type} Dosyaları</label>
                    <select
                        value={storageMapping[type] || ''}
                        onChange={e => handleMappingChange(type, e.target.value)}
                        required
                    >
                        <option value="" disabled>-- Depolama Alanı Seçin --</option>
                        {availableStorages
                            .filter(storage => storage.assetTypes.includes(type)) // Sadece o tipi destekleyen depoları göster
                            .map(storage => (
                                <option key={storage.id} value={storage.id}>{storage.name}</option>
                        ))}
                    </select>
                </div>
            ))}
            
            <hr />

            <div>
                <label>Admin'e İletilecek Not (İsteğe Bağlı)</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Ekibinizin bu proje için neden heyecanlı olduğunu anlatabilirsiniz..." />
            </div>

            <button type="submit" disabled={isLoading}>{isLoading ? 'Gönderiliyor...' : 'Teklifi Gönder'}</button>
        </form>
    );
}