import './globals.css';
import type { Metadata } from 'next';
import { PWAInstaller } from '@/components/PWAInstaller';

export const metadata: Metadata = {
  title: 'RSS + HTML Scraper Aggregator',
  description: 'RSS and HTML content aggregator with full-text extraction',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RSS Aggregator',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RSS Aggregator" />
      </head>
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-6xl p-4">
          <header className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Aggregator</h1>
            <nav className="text-sm space-x-3">
              <a href="/">Public</a>
              <a href="/admin/sources">Admin: Sources</a>
              <a href="/admin/articles">Admin: Articles</a>
              <a href="/admin/dashboard">Dashboard</a>
            </nav>
          </header>
          {children}
        </div>
        <PWAInstaller />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
