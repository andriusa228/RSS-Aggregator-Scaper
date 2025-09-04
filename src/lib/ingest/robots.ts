export async function isAllowed(urlStr: string, ua: string) {
  try {
    const url = new URL(urlStr);
    const res = await fetch(`${url.origin}/robots.txt`, { headers: { 'User-Agent': ua } });
    if (!res.ok) return true;
    const txt = await res.text();
    const lines = txt.split(/\r?\n/).map((l) => l.trim());
    let star = false,
      disall = false;
    for (const ln of lines) {
      if (/^User-agent:\s*\*/i.test(ln)) {
        star = true;
        disall = false;
        continue;
      }
      if (star && /^User-agent:/i.test(ln)) star = false;
      if (star && /^Disallow:\s*\/\s*$/i.test(ln)) disall = true;
    }
    return !disall;
  } catch {
    return true;
  }
}
