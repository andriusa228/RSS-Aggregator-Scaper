import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || '50');
  const offset = Number(searchParams.get('offset') || '0');
  const q = searchParams.get('q') || undefined;
  const sourceId = searchParams.get('sourceId') || undefined;
  const status = searchParams.get('status') || undefined;
  const lang = searchParams.get('lang') || undefined;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const categorySlug = searchParams.get('categorySlug') || undefined;

  const where: any = {};
  if (sourceId) where.sourceId = sourceId;
  if (status) where.status = status;
  if (lang) where.language = lang;
  if (from || to) {
    where.publishedAt = {};
    if (from) where.publishedAt.gte = new Date(from);
    if (to) where.publishedAt.lte = new Date(to);
  }
  if (q) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
          { url: { contains: q, mode: 'insensitive' } },
        ],
      },
    ];
  }
  if (categorySlug) {
    where.AND = [
      ...(where.AND || []),
      { source: { categories: { some: { slug: categorySlug } } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: { source: true },
      take: limit,
      skip: offset,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}
