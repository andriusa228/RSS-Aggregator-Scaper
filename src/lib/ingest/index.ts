import pLimit from 'p-limit';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/utils/logger';
import { canonicalizeUrl, sha256 } from './normalize';
import { fetchRss } from './rss';
import { scrapeHtmlList, HtmlRules } from './html';
import { isAllowed } from './robots';
import { extractReadableContent, shouldExtractFullText } from '@/lib/extractors/readability';

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

async function extractFullTextContent(url: string, userAgent: string): Promise<string | null> {
  try {
    const response = await fetchWithRetry(() => 
      fetch(url, { 
        headers: { 'User-Agent': userAgent },
        timeout: 10000 
      })
    );
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const extracted = await extractReadableContent(html, url);
    
    return extracted?.text || null;
  } catch (error) {
    log.warn('Full-text extraction failed for', url, error);
    return null;
  }
}

export async function ingestOne(sourceId: string) {
  const startTime = Date.now();
  let itemsFound = 0;
  let itemsCreated = 0;
  let errorMessage: string | null = null;
  
  try {
    const source = await prisma.source.findUnique({ where: { id: sourceId } });
    if (!source) throw new Error('Source not found');
    if (!source.enabled) return { created: 0, found: 0 };

    const ua = process.env.SCRAPER_USER_AGENT || 'AggregatorBot/1.0';
    if (!(await isAllowed(source.url, ua))) {
      log.warn('Robots disallow:', source.url);
      return { created: 0, found: 0 };
    }

    let items: { title: string; url: string; publishedAt?: Date; summary?: string }[] = [];
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

    itemsFound = items.length;

    for (const it of items) {
      const canonicalUrl = canonicalizeUrl(it.url);
      const hash = sha256(canonicalUrl);
      const urlHash = sha256(canonicalUrl + (it.title || ''));
      
      try {
        // Check for duplicates using both hash and urlHash
        const existing = await prisma.article.findFirst({
          where: {
            OR: [
              { hash },
              { urlHash }
            ]
          }
        });
        
        if (existing) {
          log.debug('Duplicate article found, skipping:', canonicalUrl);
          continue;
        }

        let content: string | null = null;
        let extractedAt: Date | null = null;

        // Extract full text if enabled and needed
        if (source.extractFullText && shouldExtractFullText(it.summary, it.title)) {
          content = await extractFullTextContent(canonicalUrl, ua);
          if (content) {
            extractedAt = new Date();
          }
        }

        await prisma.article.create({
          data: {
            sourceId: source.id,
            title: it.title || canonicalUrl,
            url: it.url,
            canonicalUrl,
            hash,
            urlHash,
            publishedAt: it.publishedAt ?? new Date(),
            summary: it.summary,
            content,
            extractedAt,
          },
        });
        itemsCreated++;
      } catch (e: any) {
        if (e?.code === 'P2002') {
          // unique violation (hash or urlHash)
          log.debug('Duplicate article found, skipping:', canonicalUrl);
        } else {
          log.warn('Create article failed', e);
        }
      }
    }

    await prisma.source.update({ where: { id: source.id }, data: { lastFetched: new Date() } });
    
    // Log the ingestion
    const duration = Date.now() - startTime;
    await prisma.ingestLog.create({
      data: {
        sourceId: source.id,
        status: 'SUCCESS',
        itemsFound,
        itemsCreated,
        duration,
      }
    });

    return { created: itemsCreated, found: itemsFound };
  } catch (error: any) {
    errorMessage = error.message;
    const duration = Date.now() - startTime;
    
    // Log the error
    await prisma.ingestLog.create({
      data: {
        sourceId,
        status: 'ERROR',
        errorMessage,
        itemsFound,
        itemsCreated,
        duration,
      }
    });
    
    throw error;
  }
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
