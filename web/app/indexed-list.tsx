'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

export interface IndexedItem {
  slug: string;
  href: string;
  title: string;
  subtitle?: string;
  group: string;
  /** Compact label for the scrubber strip, e.g. "Aug 26" for a "August 2026" group. Defaults to `group`. */
  groupShort?: string;
}

export function IndexedList({ items, placeholder }: { items: IndexedItem[]; placeholder: string }) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, IndexedItem[]>();
    const shortLabels = new Map<string, string>();
    for (const item of items) {
      if (!map.has(item.group)) { map.set(item.group, []); order.push(item.group); shortLabels.set(item.group, item.groupShort || item.group); }
      map.get(item.group)!.push(item);
    }
    return order.map((g) => ({ group: g, short: shortLabels.get(g)!, items: map.get(g)! }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  const showScrubber = !query && groups.length > 3;

  function jumpTo(group: string) {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-group="${CSS.escape(group)}"]`);
    el?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  function handleScrubberPointer(e: React.PointerEvent<HTMLDivElement>) {
    const strip = e.currentTarget;
    const rect = strip.getBoundingClientRect();
    const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height - 1);
    const idx = Math.floor((y / rect.height) * groups.length);
    const target = groups[Math.min(idx, groups.length - 1)];
    if (target) jumpTo(target.group);
  }

  return (
    <div className="indexed-list">
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          aria-label={placeholder}
        />
      </div>

      <div className="indexed-list-body" ref={listRef}>
        {filtered.length === 0 && <div className="empty">No matches.</div>}
        {filtered.map(({ group, items: groupItems }) => (
          <section key={group} data-group={group}>
            <div className="group-label">{group}</div>
            {groupItems.map((item) => (
              <Link key={item.slug} href={item.href} className="list-row">
                <div className="title">{item.title}</div>
                {item.subtitle && <div className="meta">{item.subtitle}</div>}
              </Link>
            ))}
          </section>
        ))}
      </div>

      {showScrubber && (
        <div
          className="scrubber"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handleScrubberPointer(e); }}
          onPointerMove={(e) => { if (e.buttons === 1 || e.pointerType === 'touch') handleScrubberPointer(e); }}
        >
          {groups.map(({ group, short }) => (
            <button key={group} type="button" className="scrubber-letter" onClick={() => jumpTo(group)} tabIndex={-1}>
              {short}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
