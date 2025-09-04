import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth';
import { ingestAll } from '@/lib/ingest';

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const results = await ingestAll();
  return NextResponse.json({ ok: true, results });
}
