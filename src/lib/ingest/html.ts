import * as cheerio from 'cheerio';
import { canonicalizeUrl, toDateSafe } from './normalize';

export type HtmlRules = {
  itemSelector: string;
  titleSelector?: string;
  linkSelector?: string;
  linkAttr?: string;
  dateSelector?: string;
  dateAttr?: string;
};
export type Item = { title: string; url: string; publishedAt?: Date };

export async function scrapeHtmlList(pageUrl: string, html: string, rules: HtmlRules): Promise<Item[]> {
  const $ = cheerio.load(html);
  const out: Item[] = [];
  $(rules.itemSelector).each((_, el) => {
    const linkEl = rules.linkSelector ? $(el).find(rules.linkSelector).first() : $(el).find('a').first();
    const href = linkEl.attr(rules.linkAttr || 'href');
    if (!href) return;
    const url = canonicalizeUrl(href, pageUrl);
    const title = rules.titleSelector ? $(el).find(rules.titleSelector).first().text().trim() : linkEl.text().trim();
    let publishedAt: Date | undefined;
    if (rules.dateSelector) {
      const de = $(el).find(rules.dateSelector).first();
      const raw = rules.dateAttr ? de.attr(rules.dateAttr) : de.text();
      const d = toDateSafe(raw || '');
      if (d) publishedAt = d;
    }
    if (title && url) out.push({ title, url, publishedAt });
  });
  return out;
}
