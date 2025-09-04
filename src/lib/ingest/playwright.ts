export async function renderDynamic(url: string, timeoutMs: number): Promise<string> {
  if (process.env.USE_PLAYWRIGHT !== 'true') throw new Error('Playwright disabled');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => {});
    const html = await page.content();
    return html;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
