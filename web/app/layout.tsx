import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DockNav } from './dock-nav';

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-krish.vercel.app'),
  title: 'Today',
  description: 'Collects AI and tech updates from APIs, RSS, and research feeds, then turns them into cited briefs and linked wiki pages.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Today',
    description: 'Collects AI and tech updates from APIs, RSS, and research feeds, then turns them into cited briefs and linked wiki pages.',
    siteName: 'Today',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Today',
    description: 'Collects AI and tech updates from APIs, RSS, and research feeds, then turns them into cited briefs and linked wiki pages.',
  },
};

export const viewport: Viewport = {
  themeColor: '#f6f3e9',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DockNav />
        <main id="main-content" className="app-main">{children}</main>
      </body>
    </html>
  );
}
