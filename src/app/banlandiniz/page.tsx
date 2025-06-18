// src/app/banlandiniz/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma"; // Prisma'yı import et

async function getBanDetails() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        // Giriş yapmamışsa, banlı olamaz. Ana sayfaya yönlendir.
        return { isBanned: false };
    }

    // --- DOĞRUDAN VERİTABANINDAN KONTROL ---
    const userFromDb = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        select: { isBanned: true, banReason: true, banExpiresAt: true }
    });

    if (!userFromDb || !userFromDb.isBanned) {
        return { isBanned: false };
    }
    
    const banExpires = userFromDb.banExpiresAt;
    if (banExpires && banExpires <= new Date()) {
        // Süre dolmuşsa da banlı değil
        return { isBanned: false };
    }

    return {
        isBanned: true,
        reason: userFromDb.banReason,
        expiresAt: banExpires,
    };
}

export default async function BannedPage() {
    const banDetails = await getBanDetails();

    // Eğer kullanıcı banlı değilse (veya banı dolmuşsa) ana sayfaya yönlendir
    if (!banDetails.isBanned) {
        redirect('/');
        return null;
    }

    const formattedDate = banDetails.expiresAt?.toLocaleString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        // Giriş sayfasıyla benzer bir arkaplan ve ortalama yapısı
        <div className="min-h-screen flex items-center justify-center bg-[#100C1C] p-4">
            <div className="w-full max-w-lg p-8 space-y-6 bg-prestij-bg-dark-1 shadow-2xl rounded-xl border border-red-500/20">
                <div className="text-center">
                    <ShieldExclamationIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <h1 className="text-3xl font-bold text-red-400">
                      Hesabınız Askıya Alındı
                    </h1>
                    <p className="mt-2 text-prestij-text-muted">
                      Site kurallarını ihlal ettiğiniz için hesabınıza erişiminiz kısıtlanmıştır.
                    </p>
                </div>
                
                <div className="text-left bg-prestij-bg-dark-4 p-4 rounded-md space-y-3 border border-prestij-border-secondary">
                    <p className="text-sm">
                        <span className="font-semibold text-prestij-text-secondary">Sebep:</span>
                        <span className="ml-2 text-prestij-text-primary">{banDetails.reason || 'Belirtilmemiş'}</span>
                    </p>
                    <p className="text-sm">
                        <span className="font-semibold text-prestij-text-secondary">Ban Bitiş Tarihi:</span>
                        <span className="ml-2 text-prestij-text-primary">{formattedDate || 'Kalıcı (zort)'}</span>
                    </p>
                </div>
                
                <div className="pt-2">
                    <SignOutButton />
                </div>
            </div>
        </div>
    );
}