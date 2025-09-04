import crypto from 'crypto';

const TRACKING = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'yclid',
  'mc_cid',
  'mc_eid',
]);

export function canonicalizeUrl(raw: string, base?: string) {
  const u = base ? new URL(raw, base) : new URL(raw);
  if (u.protocol === 'http:') u.protocol = 'https:';
  u.hash = '';
  for (const k of [...u.searchParams.keys()]) if (TRACKING.has(k.toLowerCase())) u.searchParams.delete(k);
  return u.toString();
}

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export const toDateSafe = (v?: string) => {
  if (!v) return;
  const d = new Date(v);
  return isNaN(+d) ? undefined : d;
};
