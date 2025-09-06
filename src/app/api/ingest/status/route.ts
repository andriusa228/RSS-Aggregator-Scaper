import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth';
import { getJobState } from '@/lib/job-state';
import { validateStatusQuery } from '@/lib/validation/ingest';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    if (!requireAdmin(req.headers.get('authorization') || undefined)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { jobId } = validateStatusQuery(searchParams);

    const state = getJobState(jobId);
    if (!state) {
      return NextResponse.json(
        { error: 'Job not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: state.jobId,
      total: state.total,
      processed: state.processed,
      successes: state.successes,
      failures: state.failures,
      done: state.done,
      canceled: state.canceled,
      startedAt: new Date(state.startedAt).toISOString(),
      updatedAt: new Date(state.updatedAt).toISOString(),
    });

  } catch (error: any) {
    console.error('Failed to get job status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}
