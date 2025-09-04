import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await req.json();
  const status = body?.status as any;
  const updated = await prisma.article.update({ where: { id }, data: { status, openedAt: status === 'READ' ? new Date() : undefined } });
  return NextResponse.json(updated);
}
