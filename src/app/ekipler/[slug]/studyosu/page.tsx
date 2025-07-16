//src/app/ekipler/[slug]/studyosu/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Bu sayfa artık sadece ana panel içeriğini render edecek.
// Tüm layout ve veri çekme işlemi layout.tsx'te.
export default async function TeamStudioDashboard() {
    const session = await getServerSession(authOptions);

    return (
        <div>
            <h1>Stüdyo Ana Paneli</h1>
            <p>Hoş geldin, {session?.user?.name}!</p>
            <p>Burada yakında tüm projelerdeki son aktiviteler ve sana özel görevler listelenecek.</p>
        </div>
    );
}