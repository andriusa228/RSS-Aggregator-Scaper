import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/auth';
import { startIngestAll } from '@/lib/ingest-runner';
import { getActiveJobId } from '@/lib/job-state';
import { validateIngestRequest } from '@/lib/validation/ingest';
import { getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    if (!requireAdmin(req.headers.get('authorization') || undefined)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    const { strategy, categorySlug } = validateIngestRequest(body);

    // Check if there's already an active job
    const activeJobId = getActiveJobId();
    if (activeJobId) {
      return NextResponse.json(
        { 
          message: 'Ingestion already running', 
          jobId: activeJobId 
        },
        { status: 409 }
      );
    }

    // Start new ingestion job
    const jobId = await startIngestAll({ strategy, categorySlug });

    const headers = getRateLimitHeaders('ingest-all', 3, 300000); // 3 requests per 5 minutes

    return NextResponse.json(
      { 
        message: 'Ingestion started', 
        jobId 
      },
      { 
        status: 202,
        headers
      }
    );

  } catch (error: any) {
    console.error('Failed to start ingestion:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start ingestion' },
      { status: 500 }
    );
  }
}