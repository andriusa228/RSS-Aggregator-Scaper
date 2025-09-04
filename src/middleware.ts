import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  // no-op, but keeps edge runtime warm if needed later
}

export const config = {
  matcher: ['/api/:path*'],
};
