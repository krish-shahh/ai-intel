import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DockNav } from './dock-nav';

export const metadata: Metadata = {
  title: 'ai-intel',
  description: 'A self-writing AI intel wiki: people, companies, and topics moving the AI world.',
  manifest: '/manifest.json',
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
        <header className="topbar">
          <a href="/" className="brand"><span>ai</span>-intel</a>
        </header>
        <main>{children}</main>
        <DockNav />
      </body>
    </html>
  );
}
