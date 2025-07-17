// src/app/api/proposals/[proposalId]/approve/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
// DÜZELTME: Gerekli enum'ları Prisma'dan import ediyoruz.
import { ProjectStatus, AssetType } from '@prisma/client';

// === DÜZELTME: Fonksiyonun döndürdüğü verinin tipini daha spesifik hale getiriyoruz ===
// Normalde bu fonksiyon, Admin'in bilgisayarındaki dosyaları bulup
// ekibin Drive'ına yükleyecek ve yüklenen dosyaların listesini döndürecek.
// Şimdilik, sanki yüklenmiş gibi sahte asset verileri oluşturuyoruz.
async function getAndUploadAssetsForContent(contentId: number): Promise<{ name: string, type: AssetType, path: string }[]> {
    // Örnek: Cyberpunk 2077 için varsayılan asset listesi
    if (contentId === 1) { 
        return [
            // Her objenin 'type' alanının AssetType enum'una uygun olduğundan emin oluyoruz.
            { name: 'dialogues_v.json', type: AssetType.TEXT, path: '/uploads/simulated/cp2077/dialogues_v.json' },
            { name: 'v_male_scream_01.wav', type: AssetType.AUDIO, path: '/uploads/simulated/cp2077/v_male_scream_01.wav' },
            { name: 'main_menu_logo.png', type: AssetType.IMAGE, path: '/uploads/simulated/cp2077/main_menu_logo.png' },
        ];
    }
    // Örnek: Arcane için
    if (contentId === 2) {
        return [
            { name: 'episode1_subtitles.srt', type: AssetType.TEXT, path: '/uploads/simulated/arcane/ep1_subtitles.srt' },
            { name: 'jinx_laugh.mp3', type: AssetType.AUDIO, path: '/uploads/simulated/arcane/jinx_laugh.mp3' },
        ];
    }
    return []; // Diğer content'ler için boş liste
}


export async function POST(
    request: Request,
    { params }: { params: { proposalId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== 'ADMIN' || !session?.user?.id) {
            return new NextResponse('Yetkisiz', { status: 403 });
        }
        const adminId = parseInt(session.user.id);
        const proposalId = parseInt(params.proposalId, 10);

        const proposal = await prisma.projectProposal.findUnique({
            where: { id: proposalId }
        });

        if (!proposal || proposal.status !== 'PENDING') {
            return new NextResponse('Geçerli veya beklemede olan bir teklif bulunamadı.', { status: 404 });
        }
        
        // === TÜM İŞLEMLERİ TEK BİR TRANSACTION İÇİNDE YAPIYORUZ ===
        const newProject = await prisma.$transaction(async (tx) => {
            // 1. Teklifin durumunu 'APPROVED' olarak güncelle.
            await tx.projectProposal.update({
                where: { id: proposalId },
                data: { status: 'APPROVED' }
            });

            // 2. Teklif bilgilerini kullanarak yeni bir proje oluştur.
            const createdProject = await tx.project.create({
                data: {
                    name: `Yeni Proje - (Teklif #${proposal.id})`, // Geçici bir ad, sonra düzenlenebilir
                    teamId: proposal.teamId,
                    contentId: proposal.contentId,
                    status: ProjectStatus.RECRUITING, // Proje ilk başta ekip toplama aşamasında başlar
                    proposalId: proposal.id, // Hangi tekliften doğduğunu bağlıyoruz
                }
            });

            // 3. (SİMÜLASYON) Content'e ait ham asset'leri bul ve yükle.
            const assetsToCreate = await getAndUploadAssetsForContent(proposal.contentId);
            
            // 4. Yüklenen her asset için veritabanında projeye özel kayıtlar oluştur.
            if (assetsToCreate.length > 0) {
                await tx.asset.createMany({
                    data: assetsToCreate.map(asset => ({
                        name: asset.name,
                        path: asset.path, // Bu yol ekibin Drive'ındaki yolu temsil edecek
                        type: asset.type,
                        projectId: createdProject.id, // Doğrudan yeni oluşturulan projeye bağlıyoruz
                        uploadedById: adminId, // Admin tarafından yüklendi
                    }))
                });
            }

            // 5. Oluşturulan projeyi geri döndür.
            return createdProject;
        });
        
        return NextResponse.json({ 
            message: 'Teklif onaylandı ve proje başarıyla oluşturuldu!',
            projectId: newProject.id
        });

    } catch (error) {
        console.error("[PROPOSAL_APPROVE_ERROR]", error);
        return new NextResponse("Sunucu hatası: " + (error instanceof Error ? error.message : "Bilinmeyen hata"), { status: 500 });
    }
}