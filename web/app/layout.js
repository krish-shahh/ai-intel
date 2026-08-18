import './globals.css';
import { TopNav, TabBar } from './nav';

export const metadata = {
  title: 'ai-intel',
  description: 'A self-writing AI intel wiki: people, companies, and topics moving the AI world.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#16161a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a href="/" className="brand"><span>ai</span>-intel</a>
          <TopNav />
        </header>
        <main>{children}</main>
        <TabBar />
      </body>
    </html>
  );
}
