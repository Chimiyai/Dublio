//src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions'; // authOptions'ı yeni dosyadan import et

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };