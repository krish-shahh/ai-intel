'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [pointerY, setPointerY] = useState(0);
  const [barLeft, setBarLeft] = useState(0);

  // Cache the bar's geometry once per drag instead of measuring on every
  // pointermove/render — repeated getBoundingClientRect() calls during a fast
  // swipe force synchronous layout and were the source of the mobile stutter.
  const barRectRef = useRef<{ top: number; height: number } | null>(null);
  const pendingYRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

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

  const applyClientY = useCallback(
    (clientY: number) => {
      const rect = barRectRef.current;
      if (!rect) return;
      const relativeY = Math.min(rect.height - 1, Math.max(0, clientY - rect.top));
      const idx = Math.min(groups.length - 1, Math.floor((relativeY / rect.height) * groups.length));
      const slotH = rect.height / groups.length;
      setPointerY(rect.top + slotH * (idx + 0.5));
      setActiveIndex((prev) => {
        if (idx !== prev) jumpTo(groups[idx].group);
        return idx;
      });
    },
    [groups]
  );

  // Coalesce rapid pointermove events (mobile can fire well above 60Hz) into
  // one state update per animation frame, so a fast swipe can't get the
  // React tree and the touch position out of sync.
  const scheduleUpdate = useCallback(
    (clientY: number) => {
      pendingYRef.current = clientY;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (pendingYRef.current !== null) applyClientY(pendingYRef.current);
      });
    },
    [applyClientY]
  );

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    barRectRef.current = { top: rect.top, height: rect.height };
    setBarLeft(rect.left);
    applyClientY(e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!barRectRef.current) return;
    scheduleUpdate(e.clientY);
  }

  function endScrub() {
    setActiveIndex(null);
    barRectRef.current = null;
    pendingYRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

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
        <>
          <div
            ref={scrubberRef}
            className="scrubber"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
          >
            {groups.map(({ group, short }, i) => (
              <button
                key={group}
                type="button"
                className={activeIndex === i ? 'scrubber-letter scrubber-letter-active' : 'scrubber-letter'}
                onClick={() => jumpTo(group)}
                tabIndex={-1}
              >
                {short}
              </button>
            ))}
          </div>

          {activeIndex !== null && (
            <div className="scrubber-bubble" style={{ top: pointerY, left: barLeft }}>
              {groups[activeIndex].short}
            </div>
          )}
        </>
      )}
    </div>
  );
}
