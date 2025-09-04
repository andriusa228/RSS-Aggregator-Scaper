import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const viewId = searchParams.get('viewId');
  if (!viewId) return new NextResponse('viewId required', { status: 400 });
  const view = await prisma.savedView.findUnique({ where: { id: viewId } });
  if (!view) return new NextResponse('Not found', { status: 404 });

  const filter = view.filter ? JSON.parse(view.filter as unknown as string) : {};
  const where: any = {};
  if (filter.sources?.length) where.sourceId = { in: filter.sources };
  if (filter.status) where.status = filter.status;
  if (filter.lang) where.language = filter.lang;
  if (filter.q) where.title = { contains: filter.q, mode: 'insensitive' };
  if (filter.fromHours) where.publishedAt = { gte: new Date(Date.now() - filter.fromHours * 3600 * 1000) };

  const items = await prisma.article.findMany({ where, include: { source: true }, orderBy: { publishedAt: 'desc' } });

  const rows = [
    ['Title', 'URL', 'Source', 'Published'].join(','),
    ...items.map((a) => [
      '"' + (a.title?.replace(/"/g, '""') || '') + '"',
      a.canonicalUrl,
      '"' + (a.source?.name?.replace(/"/g, '""') || '') + '"',
      a.publishedAt?.toISOString() || ''
    ].join(',')),
  ].join('\n');

  return new NextResponse(rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="export-${viewId}.csv"`,
    },
  });
}
