import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth';
import { ingestOne } from '@/lib/ingest';

export async function POST(req: NextRequest, { params }: { params: { sourceId: string } }) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const result = await ingestOne(params.sourceId);
  return NextResponse.json({ ok: true, result });
}
