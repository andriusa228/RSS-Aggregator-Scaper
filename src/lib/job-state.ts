export type IngestJobState = {
  jobId: string;
  total: number;
  processed: number;
  successes: number;
  failures: { sourceId: string; error: string }[];
  startedAt: number;
  updatedAt: number;
  done: boolean;
  canceled?: boolean;
};

// In-memory job state storage
const jobStates = new Map<string, IngestJobState>();

// TTL for job cleanup (1 hour)
const JOB_TTL = 60 * 60 * 1000;

// Cleanup expired jobs
function cleanupExpiredJobs() {
  const now = Date.now();
  for (const [jobId, state] of jobStates.entries()) {
    if (now - state.updatedAt > JOB_TTL) {
      jobStates.delete(jobId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredJobs, 5 * 60 * 1000);

export function createJobState(jobId: string, total: number): IngestJobState {
  const now = Date.now();
  const state: IngestJobState = {
    jobId,
    total,
    processed: 0,
    successes: 0,
    failures: [],
    startedAt: now,
    updatedAt: now,
    done: false,
    canceled: false,
  };
  
  jobStates.set(jobId, state);
  return state;
}

export function getJobState(jobId: string): IngestJobState | null {
  return jobStates.get(jobId) || null;
}

export function updateJobState(
  jobId: string, 
  updates: Partial<Pick<IngestJobState, 'processed' | 'successes' | 'failures' | 'done' | 'canceled'>>
): void {
  const state = jobStates.get(jobId);
  if (!state) return;
  
  Object.assign(state, updates, { updatedAt: Date.now() });
}

export function getActiveJobId(): string | null {
  for (const [jobId, state] of jobStates.entries()) {
    if (!state.done && !state.canceled) {
      return jobId;
    }
  }
  return null;
}

export function getAllJobStates(): IngestJobState[] {
  return Array.from(jobStates.values());
}

export function deleteJobState(jobId: string): boolean {
  return jobStates.delete(jobId);
}
