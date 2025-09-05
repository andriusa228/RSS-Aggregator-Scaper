import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth';
import { ingestAll, ingestOne } from '@/lib/ingest';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get('categorySlug') || undefined;
  if (!categorySlug) {
    const results = await ingestAll();
    return NextResponse.json({ ok: true, results });
  }
  const sources = await prisma.source.findMany({ where: { enabled: true, categories: { some: { slug: categorySlug } } } });
  const results: any[] = [];
  for (const s of sources) {
    const r = await ingestOne(s.id);
    results.push({ sourceId: s.id, created: r.created });
  }
  return NextResponse.json({ ok: true, categorySlug, count: sources.length, results });
}
