'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Today', match: (path: string) => path === '/' },
  { href: '/briefs', label: 'Briefs', match: (path: string) => path.startsWith('/briefs') },
  { href: '/topics', label: 'Topics', match: (path: string) => path.startsWith('/topics') },
  { href: '/companies', label: 'Companies', match: (path: string) => path.startsWith('/companies') },
  { href: '/people', label: 'People', match: (path: string) => path.startsWith('/people') },
  { href: '/graph', label: 'Graph', match: (path: string) => path.startsWith('/graph') },
];

export function DockNav() {
  const pathname = usePathname();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <nav className="desktop-nav" aria-label="Main navigation">
          {ITEMS.map(({ href, label, match }) => {
            const active = match(pathname);
            return (
              <Link key={href} href={href} className={active ? 'nav-link is-active' : 'nav-link'} aria-current={active ? 'page' : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
