'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, Users, Building2, Tags, Network } from 'lucide-react';
import { Dock, DockIcon } from '@/components/ui/dock';

const TABS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/briefs', label: 'Briefs', icon: Newspaper, match: (p: string) => p.startsWith('/briefs') },
  { href: '/people', label: 'People', icon: Users, match: (p: string) => p.startsWith('/people') },
  { href: '/companies', label: 'Companies', icon: Building2, match: (p: string) => p.startsWith('/companies') },
  { href: '/topics', label: 'Topics', icon: Tags, match: (p: string) => p.startsWith('/topics') },
  { href: '/graph', label: 'Graph', icon: Network, match: (p: string) => p.startsWith('/graph') },
];

export function DockNav() {
  const pathname = usePathname();

  return (
    <div className="dock-wrap">
      <Dock iconSize={44} iconMagnification={56} iconDistance={100} className="dock-shell">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <DockIcon key={href} className={active ? 'dock-icon dock-icon-active' : 'dock-icon'}>
              <Link href={href} aria-label={label} aria-current={active ? 'page' : undefined} className="dock-link">
                <Icon size={18} strokeWidth={2} />
              </Link>
            </DockIcon>
          );
        })}
      </Dock>
    </div>
  );
}
