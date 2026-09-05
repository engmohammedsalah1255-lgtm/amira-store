import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: 'ok' });
  } catch (error) {
    console.error('GET /api/health database check failed:', error);
    return NextResponse.json({ ok: false, database: 'unavailable' }, { status: 503 });
  }
}
