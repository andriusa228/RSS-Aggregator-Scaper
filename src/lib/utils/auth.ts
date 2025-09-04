export function requireAdmin(authHeader?: string) {
  const token = process.env.ADMIN_TOKEN || '';
  if (!token) throw new Error('ADMIN_TOKEN not set');
  if (!authHeader) return false;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  return m[1] === token;
}
