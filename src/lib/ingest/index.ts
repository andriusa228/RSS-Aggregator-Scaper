import pLimit from 'p-limit';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/utils/logger';
import { canonicalizeUrl, sha256 } from './normalize';
import { fetchRss } from './rss';
import { scrapeHtmlList, HtmlRules } from './html';
import { isAllowed } from './robots';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function fetchWithRetry<T>(fn: () => Promise<T>, attempts = 3, backoffMs = 800): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await delay(backoffMs * Math.pow(2, i));
    }
  }
  throw lastErr;
}

export async function ingestOne(sourceId: string) {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error('Source not found');
  if (!source.enabled) return { created: 0 };

  const ua = process.env.SCRAPER_USER_AGENT || 'AggregatorBot/1.0';
  if (!(await isAllowed(source.url, ua))) {
    log.warn('Robots disallow:', source.url);
    return { created: 0 };
  }

  let items: { title: string; url: string; publishedAt?: Date }[] = [];
  const tryRss = source.type === 'RSS' || source.type === 'AUTO';
  const tryHtml = source.type === 'HTML' || source.type === 'AUTO';

  if (tryRss) {
    try {
      items = await fetchWithRetry(() => fetchRss(source.url, ua));
    } catch (e) {
      log.warn('RSS fetch failed for', source.url, e);
    }
  }

  if ((!items || items.length === 0) && tryHtml) {
    try {
      const res = await fetchWithRetry(() => fetch(source.url, { headers: { 'User-Agent': ua } }));
      const html = await res.text();
      const rules: HtmlRules = source.rules ? JSON.parse(source.rules as unknown as string) : ({} as HtmlRules);
      if (!rules.itemSelector) throw new Error('Missing itemSelector in rules');
      items = await scrapeHtmlList(source.url, html, rules);
    } catch (e) {
      log.warn('HTML scrape failed for', source.url, e);
    }
  }

  let created = 0;
  for (const it of items) {
    const canonicalUrl = canonicalizeUrl(it.url);
    const hash = sha256(canonicalUrl);
    try {
      await prisma.article.create({
        data: {
          sourceId: source.id,
          title: it.title || canonicalUrl,
          url: it.url,
          canonicalUrl,
          hash,
          publishedAt: it.publishedAt ?? new Date(),
        },
      });
      created++;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // unique violation (hash)
      } else {
        log.warn('Create article failed', e);
      }
    }
  }

  await prisma.source.update({ where: { id: source.id }, data: { lastFetched: new Date() } });
  return { created };
}

export async function ingestAll() {
  const sources = await prisma.source.findMany({ where: { enabled: true } });
  const concurrency = Number(process.env.FETCH_CONCURRENCY || 2);
  const delayMs = Number(process.env.FETCH_DELAY_MS || 500);
  const limit = pLimit(concurrency);
  let i = 0;

  const results = await Promise.all(
    sources.map((s) =>
      limit(async () => {
        if (i++ > 0) await delay(delayMs);
        return ingestOne(s.id);
      })
    )
  );
  return results;
}
