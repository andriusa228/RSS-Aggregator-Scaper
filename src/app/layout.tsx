import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RSS + HTML Scraper Aggregator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-6xl p-4">
          <header className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Aggregator</h1>
            <nav className="text-sm space-x-3">
              <a href="/">Public</a>
              <a href="/admin/sources">Admin: Sources</a>
              <a href="/admin/articles">Admin: Articles</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
