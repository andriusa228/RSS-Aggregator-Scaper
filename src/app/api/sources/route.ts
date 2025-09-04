import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const sources = await prisma.source.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(sources);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const data = await req.json();
  const created = await prisma.source.create({ data: { ...data, rules: data.rules && typeof data.rules !== 'string' ? JSON.stringify(data.rules) : data.rules } });
  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const data = await req.json();
  const { id, ...rest } = data || {};
  const updated = await prisma.source.update({ where: { id }, data: { ...rest, rules: rest.rules && typeof rest.rules !== 'string' ? JSON.stringify(rest.rules) : rest.rules } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) return new NextResponse('Unauthorized', { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  await prisma.source.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
