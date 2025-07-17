//src/components/projects/NewProjectForm.tsx
'use client';

import { useState, FormEvent } from 'react';
// DİKKAT: Prop olarak tam Prisma modellerini alacağımız için onları import ediyoruz.
import { Team, Content } from '@prisma/client'; 
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Props {
    teams: Team[];
    contents: Content[];
}

export default function NewProjectForm({ teams, contents }: Props) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    // Form state'leri
    // Artık gelen `teams` prop'unu kullanarak başlangıç değerini güvenle atayabiliriz.
    const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id.toString() || '');
    const [selectedContentId, setSelectedContentId] = useState<string>('');
    const [projectName, setProjectName] = useState('');

    const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if(!selectedTeamId || !selectedContentId) {
        toast.error("Lütfen bir ekip ve içerik seçin.");
        return;
    }
    if(!projectName || projectName.length < 5) {
        toast.error("Proje adı en az 5 karakter olmalıdır.");
        return;
    }

    setIsLoading(true);
    toast.loading("Proje oluşturuluyor...");

    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamId: parseInt(selectedTeamId),
                contentId: parseInt(selectedContentId),
                name: projectName,
            })
        });

        // Gelen yanıtın gövdesini (body) her zaman oku
        const responseData = await response.json();
        toast.dismiss();

        // Yanıt OK değilse, sunucudan gelen mesajı göster
        if (!response.ok) {
            // Zod hataları varsa daha detaylı gösterelim
            if (responseData.errors) {
                const errorMessages = Object.values(responseData.errors).flat().join('\n');
                throw new Error(errorMessages);
            }
            // Genel bir hata mesajı varsa onu gösterelim
            throw new Error(responseData.message || "Bilinmeyen bir hata oluştu.");
        }
        
        // Başarılıysa devam et
        const newProject = responseData;
        toast.success("Proje başarıyla başlatıldı!");
        router.push(`/projeler/${newProject.id}`);

    } catch (error: any) {
        toast.dismiss();
        // Hata mesajını toast ile ekrana bas
        toast.error(error.message);
    } finally {
        setIsLoading(false);
    }
};
    
    return (
        <div style={{ maxWidth: '700px', margin: '50px auto', color: 'white', background: '#1c1c1c', padding: '20px' }}>
            <h1>Yeni Proje Başlat</h1>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>
                Ekibinizle hayata geçirmek istediğiniz yeni bir yerelleştirme projesi başlatın.
            </p>

            {contents.length === 0 ? (
                <p>Harika! Şu anda projelendirilmeyi bekleyen bir içerik bulunmuyor.</p>
            ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label>Hangi Ekip Adına?</label>
                        <select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} style={{width: '100%', padding: '10px'}}>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label>Hangi İçerik Projelendirilecek?</label>
                        <select value={selectedContentId} onChange={e => setSelectedContentId(e.target.value)} style={{width: '100%', padding: '10px'}}>
                            <option value="">-- İçerik Seçin --</option>
                            {contents.map(content => <option key={content.id} value={content.id}>{content.title} ({content.type})</option>)}
                        </select>
                    </div>

                    <div>
                        <label>Proje Adı</label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={e => setProjectName(e.target.value)}
                            placeholder="Örn: The Witcher 3 - Türkçe Dublaj Projesi"
                            style={{ width: '100%', padding: '10px' }}
                        />
                    </div>

                    <button type="submit" disabled={isLoading} style={{padding: '12px', background: 'purple'}}>
                        {isLoading ? 'Başlatılıyor...' : 'Projeyi Başlat'}
                    </button>
                </form>
            )}
        </div>
    );
}