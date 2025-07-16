//src/app/api/admin/contents/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { ContentType } from '@prisma/client';

// Rol kontrolü için yardımcı fonksiyon
async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === 'ADMIN';
}

// Tüm içerikleri listele
export async function GET() {
    if (!(await isAdmin())) return new NextResponse('Yetkisiz', { status: 403 });
    const contents = await prisma.content.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(contents);
}

// Yeni içerik oluştur
export async function POST(request: Request) {
    if (!(await isAdmin())) return new NextResponse('Yetkisiz', { status: 403 });
    
    const data = await request.json();
    // TODO: Zod ile veri doğrulaması eklenmeli
    
    const newContent = await prisma.content.create({ data });
    return NextResponse.json(newContent, { status: 201 });
}