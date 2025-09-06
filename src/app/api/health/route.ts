import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        lastIngest: null as string | null,
        uptime: process.uptime()
      }
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'unhealthy';
    }

    // Get last ingest time
    try {
      const lastIngest = await prisma.ingestLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });
      health.services.lastIngest = lastIngest?.createdAt.toISOString() || null;
    } catch (error) {
      // Ignore error for last ingest
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });

  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 });
  }
}
