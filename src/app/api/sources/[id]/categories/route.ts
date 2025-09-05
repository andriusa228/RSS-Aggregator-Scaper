import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const sourceId = params.id;
  const body = await req.json();
  const slugs: string[] = body?.categorySlugs || [];
  const categories = await prisma.category.findMany({ where: { slug: { in: slugs } } });
  const updated = await prisma.source.update({
    where: { id: sourceId },
    data: { categories: { set: categories.map(c => ({ id: c.id })) } },
    include: { categories: true },
  });
  return NextResponse.json(updated);
}

