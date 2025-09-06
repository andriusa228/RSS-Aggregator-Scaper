import pLimit from 'p-limit';
import { prisma } from '@/lib/prisma';
import { ingestOne } from '@/lib/ingest';
import { createJobState, updateJobState } from '@/lib/job-state';
import { log } from '@/lib/utils/logger';

export type IngestAllOptions = {
  strategy?: 'AUTO' | 'RSS' | 'HTML';
  categorySlug?: string;
};

export async function startIngestAll(options: IngestAllOptions = {}): Promise<string> {
  const jobId = `ingest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Get sources based on options
  const where: any = { enabled: true };
  
  if (options.categorySlug) {
    where.categories = { some: { slug: options.categorySlug } };
  }
  
  if (options.strategy && options.strategy !== 'AUTO') {
    where.type = options.strategy;
  }
  
  const sources = await prisma.source.findMany({
    where,
    include: { categories: true }
  });
  
  if (sources.length === 0) {
    throw new Error('No sources found matching criteria');
  }
  
  // Create job state
  const state = createJobState(jobId, sources.length);
  
  log.info(`Starting ingest job ${jobId} with ${sources.length} sources`);
  
  // Start background processing
  processIngestJob(jobId, sources).catch(error => {
    log.error(`Ingest job ${jobId} failed:`, error);
    updateJobState(jobId, { 
      done: true,
      failures: [{ sourceId: 'system', error: error.message }]
    });
  });
  
  return jobId;
}

async function processIngestJob(jobId: string, sources: any[]): Promise<void> {
  const concurrency = Number(process.env.FETCH_CONCURRENCY || 2);
  const limit = pLimit(concurrency);
  
  let processed = 0;
  let successes = 0;
  const failures: { sourceId: string; error: string }[] = [];
  
  // Process sources with concurrency limit
  const promises = sources.map(source => 
    limit(async () => {
      try {
        log.info(`Processing source ${source.id} (${source.name})`);
        
        const result = await ingestOne(source.id);
        
        successes++;
        log.info(`Source ${source.id} completed: ${result.created} articles created`);
        
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        failures.push({ sourceId: source.id, error: errorMessage });
        log.error(`Source ${source.id} failed:`, errorMessage);
      } finally {
        processed++;
        updateJobState(jobId, {
          processed,
          successes,
          failures: [...failures]
        });
      }
    })
  );
  
  // Wait for all sources to complete
  await Promise.all(promises);
  
  // Mark job as done
  updateJobState(jobId, { done: true });
  
  log.info(`Ingest job ${jobId} completed: ${successes} successes, ${failures.length} failures`);
}

export async function cancelIngestJob(jobId: string): Promise<boolean> {
  const state = getJobState(jobId);
  if (!state || state.done) {
    return false;
  }
  
  updateJobState(jobId, { canceled: true, done: true });
  log.info(`Ingest job ${jobId} canceled`);
  
  return true;
}

// Import getJobState for the cancel function
import { getJobState } from '@/lib/job-state';
