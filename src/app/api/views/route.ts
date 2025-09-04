import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const views = await prisma.savedView.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(views);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const data = await req.json();
  const created = await prisma.savedView.create({ data: { ...data, filter: typeof data.filter === 'string' ? data.filter : JSON.stringify(data.filter ?? {}) } });
  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const data = await req.json();
  const { id, ...rest } = data || {};
  const updated = await prisma.savedView.update({ where: { id }, data: { ...rest, filter: typeof rest.filter === 'string' ? rest.filter : JSON.stringify(rest.filter ?? {}) } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  await prisma.savedView.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
