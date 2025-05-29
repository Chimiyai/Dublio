// src/app/api/comments/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  console.log(`SIMPLE GET isteği /api/comments/test`);
  return NextResponse.json({ message: `GET isteği /api/comments/test (BASİT TEST)` }, { status: 200 });
}