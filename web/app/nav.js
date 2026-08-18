'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Home', match: (p) => p === '/' },
  { href: '/briefs', label: 'Briefs', match: (p) => p.startsWith('/briefs') },
  { href: '/people', label: 'People', match: (p) => p.startsWith('/people') },
  { href: '/companies', label: 'Companies', match: (p) => p.startsWith('/companies') },
  { href: '/topics', label: 'Topics', match: (p) => p.startsWith('/topics') },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav>
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={t.match(pathname) ? 'active' : ''}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <div className="tabbar">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={t.match(pathname) ? 'active' : ''}>
          <span className="dot" />
          {t.label}
        </Link>
      ))}
    </div>
  );
}
