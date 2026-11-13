import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DockNav } from './dock-nav';

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-krish.vercel.app'),
  title: 'ai-intel',
  description: 'Collects AI and tech updates from APIs, RSS, and research feeds, then turns them into cited briefs and linked wiki pages.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'ai-intel',
    description: 'Collects AI and tech updates from APIs, RSS, and research feeds, then turns them into cited briefs and linked wiki pages.',
    siteName: 'ai-intel',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ai-intel',
    description: 'Collects AI and tech updates from APIs, RSS, and research feeds, then turns them into cited briefs and linked wiki pages.',
  },
};

export const viewport: Viewport = {
  themeColor: '#16161a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <DockNav />
      </body>
    </html>
  );
}
