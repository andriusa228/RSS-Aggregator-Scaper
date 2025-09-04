import 'dotenv/config';
import { scrapeHtmlList, HtmlRules } from '@/lib/ingest/html';

async function main() {
  const url = process.argv[2];
  const rulesJson = process.argv[3];
  if (!url || !rulesJson) {
    console.error('Usage: tsx scripts/test-fetch.ts <url> <rules-json>');
    process.exit(1);
  }
  const rules: HtmlRules = JSON.parse(rulesJson);
  const res = await fetch(url);
  const html = await res.text();
  const items = await scrapeHtmlList(url, html, rules);
  console.log(items.slice(0, 20));
}

main();
