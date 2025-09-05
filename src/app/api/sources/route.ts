import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get('categorySlug') || undefined;
  const where: any = {};
  if (categorySlug) where.categories = { some: { slug: categorySlug } };
  const sources = await prisma.source.findMany({ where, orderBy: { createdAt: 'desc' }, include: { categories: true } });
  return NextResponse.json(sources);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const data = await req.json();
  const categories = (data.categories || []) as { slug: string }[];
  const cats = await prisma.category.findMany({ where: { slug: { in: categories.map((c:any)=>c.slug) } } });
  const created = await prisma.source.create({ data: { ...data, rules: data.rules && typeof data.rules !== 'string' ? JSON.stringify(data.rules) : data.rules, categories: { connect: cats.map(c=>({ id: c.id })) } }, include: { categories: true } });
  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const data = await req.json();
  const { id, ...rest } = data || {};
  const categories = (rest.categories || []) as { slug: string }[];
  const cats = await prisma.category.findMany({ where: { slug: { in: categories.map((c:any)=>c.slug) } } });
  const updated = await prisma.source.update({ where: { id }, data: { ...rest, rules: rest.rules && typeof rest.rules !== 'string' ? JSON.stringify(rest.rules) : rest.rules, categories: { set: cats.map(c=>({ id: c.id })) } }, include: { categories: true } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  await prisma.source.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
