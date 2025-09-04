import Parser from 'rss-parser';
import { canonicalizeUrl } from './normalize';

export type RssItem = { title: string; url: string; publishedAt?: Date };

export async function fetchRss(url: string, userAgent: string): Promise<RssItem[]> {
  const parser = new Parser({
    headers: { 'User-Agent': userAgent },
    timeout: 15000,
  } as any);

  const feed = await parser.parseURL(url);
  const items: RssItem[] = [];
  for (const it of feed.items || []) {
    const link = it.link || it.guid || '';
    if (!link) continue;
    const title = (it.title || '').trim();
    const publishedAt = it.isoDate ? new Date(it.isoDate) : it.pubDate ? new Date(it.pubDate) : undefined;
    items.push({ title, url: canonicalizeUrl(link), publishedAt });
  }
  return items;
}
