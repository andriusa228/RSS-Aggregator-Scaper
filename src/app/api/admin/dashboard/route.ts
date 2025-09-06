import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  if (!requireAdmin(req.headers.get('authorization') || undefined)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get basic stats
    const [totalArticles, totalSources] = await Promise.all([
      prisma.article.count(),
      prisma.source.count({ where: { enabled: true } })
    ]);

    // Get recent ingests
    const recentIngests = await prisma.ingestLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { source: { select: { name: true } } }
    });

    // Get top sources by article count
    const topSources = await prisma.source.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { articles: true } }
      },
      orderBy: { articles: { _count: 'desc' } },
      take: 10
    });

    // Get daily stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await prisma.article.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      totalArticles,
      totalSources,
      recentIngests: recentIngests.map(ingest => ({
        id: ingest.id,
        sourceId: ingest.sourceId,
        sourceName: ingest.source.name,
        status: ingest.status,
        itemsFound: ingest.itemsFound,
        itemsCreated: ingest.itemsCreated,
        duration: ingest.duration,
        createdAt: ingest.createdAt,
        errorMessage: ingest.errorMessage
      })),
      topSources: topSources.map(source => ({
        sourceId: source.id,
        sourceName: source.name,
        articleCount: source._count.articles
      })),
      dailyStats: dailyStats.map(stat => ({
        date: stat.createdAt.toISOString().split('T')[0],
        articlesCreated: stat._count.id,
        sourcesProcessed: 0 // This would need a separate query
      }))
    });

  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
