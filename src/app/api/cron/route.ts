import { NextResponse } from 'next/server';
import cron from 'node-cron';
import { ingestAll } from '@/lib/ingest';

let started = false;

export async function GET() {
  if (process.env.CRON_ENABLED === 'true' && !started) {
    const expr = process.env.CRON_EXPR || '0 */4 * * *';
    cron.schedule(expr, async () => {
      try { await ingestAll(); } catch {}
    });
    started = true;
  }
  return NextResponse.json({ cron: started });
}
