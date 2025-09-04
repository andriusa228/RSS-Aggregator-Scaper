import { NextRequest, NextResponse } from 'next/server';
import { scrapeHtmlList, HtmlRules } from '@/lib/ingest/html';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = String(body.url || '');
  const rules: HtmlRules = typeof body.rules === 'string' ? JSON.parse(body.rules) : body.rules;
  if (!url || !rules?.itemSelector) return new NextResponse('Bad request', { status: 400 });
  const res = await fetch(url);
  const html = await res.text();
  const items = await scrapeHtmlList(url, html, rules);
  return NextResponse.json({ count: items.length, items });
}
