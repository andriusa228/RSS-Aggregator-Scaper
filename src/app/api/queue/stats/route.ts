import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth';
import { getQueueStats } from '@/lib/queue';

export async function GET(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const stats = await getQueueStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
