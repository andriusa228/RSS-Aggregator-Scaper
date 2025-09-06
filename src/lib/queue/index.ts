import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { ingestOne, ingestAll } from '@/lib/ingest';
import { log } from '@/lib/utils/logger';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});

// Job types
export interface IngestSourceJob {
  sourceId: string;
  priority?: number;
}

export interface IngestAllJob {
  categorySlug?: string;
  priority?: number;
}

// Create queues
export const ingestQueue = new Queue<IngestSourceJob>('ingest-source', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const ingestAllQueue = new Queue<IngestAllJob>('ingest-all', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// Job processors
export const ingestWorker = new Worker<IngestSourceJob>(
  'ingest-source',
  async (job: Job<IngestSourceJob>) => {
    const { sourceId } = job.data;
    log.info(`Processing ingest job for source: ${sourceId}`);
    
    try {
      const result = await ingestOne(sourceId);
      log.info(`Ingest completed for source ${sourceId}:`, result);
      return result;
    } catch (error) {
      log.error(`Ingest failed for source ${sourceId}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3, // Process up to 3 jobs concurrently
  }
);

export const ingestAllWorker = new Worker<IngestAllJob>(
  'ingest-all',
  async (job: Job<IngestAllJob>) => {
    const { categorySlug } = job.data;
    log.info(`Processing ingest-all job for category: ${categorySlug || 'all'}`);
    
    try {
      const result = await ingestAll();
      log.info(`Ingest-all completed:`, result);
      return result;
    } catch (error) {
      log.error(`Ingest-all failed:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1, // Only one ingest-all job at a time
  }
);

// Queue management functions
export async function addIngestSourceJob(sourceId: string, priority = 0) {
  return await ingestQueue.add(
    'ingest-source',
    { sourceId, priority },
    { priority }
  );
}

export async function addIngestAllJob(categorySlug?: string, priority = 0) {
  return await ingestAllQueue.add(
    'ingest-all',
    { categorySlug, priority },
    { priority }
  );
}

export async function scheduleRecurringIngest() {
  // Schedule high-priority sources every 15 minutes
  await ingestQueue.add(
    'ingest-source',
    { sourceId: 'high-priority', priority: 10 },
    {
      repeat: { pattern: '*/15 * * * *' }, // Every 15 minutes
      jobId: 'recurring-high-priority',
    }
  );

  // Schedule regular sources every 4 hours
  await ingestAllQueue.add(
    'ingest-all',
    { priority: 5 },
    {
      repeat: { pattern: '0 */4 * * *' }, // Every 4 hours
      jobId: 'recurring-ingest-all',
    }
  );
}

export async function getQueueStats() {
  const [ingestStats, ingestAllStats] = await Promise.all([
    ingestQueue.getJobCounts(),
    ingestAllQueue.getJobCounts(),
  ]);

  return {
    ingest: ingestStats,
    ingestAll: ingestAllStats,
  };
}

// Graceful shutdown
export async function closeQueues() {
  await Promise.all([
    ingestWorker.close(),
    ingestAllWorker.close(),
    ingestQueue.close(),
    ingestAllQueue.close(),
    redis.disconnect(),
  ]);
}
