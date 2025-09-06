import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth';
import { addIngestSourceJob, addIngestAllJob } from '@/lib/queue';

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { sourceId, categorySlug, priority = 0 } = body;

    if (sourceId) {
      const job = await addIngestSourceJob(sourceId, priority);
      return NextResponse.json({ 
        message: 'Ingest job queued', 
        jobId: job.id,
        sourceId 
      });
    } else {
      const job = await addIngestAllJob(categorySlug, priority);
      return NextResponse.json({ 
        message: 'Ingest-all job queued', 
        jobId: job.id,
        categorySlug 
      });
    }
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
