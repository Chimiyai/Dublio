// src/components/admin/ProposalCard.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { type ProposalWithDetails } from '@/app/admin/teklifler/page';

interface Props {
  proposal: ProposalWithDetails;
}

export default function ProposalCard({ proposal }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Teklifi yönetmek için API'ye istek atacak fonksiyon
    const handleProposalAction = async (action: 'approve' | 'reject') => {
        if (!confirm(`Bu teklifi "${action === 'approve' ? 'ONAYLAMAK' : 'REDDETMEK'}" istediğinizden emin misiniz?`)) {
            return;
        }

        setIsLoading(true);
        toast.loading("İşlem gerçekleştiriliyor...");

        try {
            const response = await fetch(`/api/proposals/${proposal.id}/${action}`, {
                method: 'POST',
            });

            const responseData = await response.json();
            toast.dismiss();

            if (!response.ok) throw new Error(responseData.message || 'İşlem başarısız oldu.');

            toast.success(responseData.message);
            router.refresh(); // Sayfadaki veriyi yenile

        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '4px solid purple' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem' }}>{proposal.content.title}</h3>
                    <p style={{ color: '#aaa' }}>
                        <strong>Ekip:</strong> {proposal.team.name} | <strong>Tür:</strong> {proposal.content.type}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleProposalAction('approve')} disabled={isLoading} style={{ background: 'darkgreen' }}>
                        Onayla
                    </button>
                    <button onClick={() => handleProposalAction('reject')} disabled={isLoading} style={{ background: 'darkred' }}>
                        Reddet
                    </button>
                </div>
            </div>
            
            {proposal.message && (
                <div style={{ marginTop: '15px', background: '#2a2a2a', padding: '10px', borderRadius: '4px' }}>
                    <p><strong>Ekibin Notu:</strong></p>
                    <p style={{ fontStyle: 'italic' }}>"{proposal.message}"</p>
                </div>
            )}
            
            <div style={{ marginTop: '15px' }}>
                <p><strong>Depolama Atamaları:</strong></p>
                <pre style={{ background: '#2a2a2a', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(proposal.storageMapping, null, 2)}
                </pre>
            </div>
        </div>
    );
}