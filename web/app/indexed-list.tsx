'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';

export interface IndexedItem {
  slug: string;
  href: string;
  title: string;
  subtitle?: string;
  group: string;
  /** Compact label for the scrubber strip, e.g. "Aug 26" for a "August 2026" group. Defaults to `group`. */
  groupShort?: string;
}

// Bubble silhouette: a Gaussian bell curve rotated 90°, so width-from-the-strip
// tapers smoothly from 0 at top/bottom (flush, "attached" to the letter column)
// to a peak bulge at the vertical center. Precomputed once — the shape never
// changes, only its screen position does.
const BUBBLE_W = 84;
const BUBBLE_H = 168;
function buildBellPath(w: number, h: number): string {
  const cy = h / 2;
  const sigma = h / 6.2;
  const steps = 48;
  let d = `M ${w} 0`;
  for (let i = 1; i <= steps; i++) {
    const y = (i / steps) * h;
    const x = w - w * Math.exp(-((y - cy) ** 2) / (2 * sigma * sigma));
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  d += ` L ${w} ${h} Z`;
  return d;
}
const BELL_PATH = buildBellPath(BUBBLE_W, BUBBLE_H);

export function IndexedList({ items, placeholder }: { items: IndexedItem[]; placeholder: string }) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [pointerY, setPointerY] = useState(0);

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

  const indexFromClientY = useCallback(
    (clientY: number) => {
      const bar = scrubberRef.current;
      if (!bar) return null;
      const rect = bar.getBoundingClientRect();
      const relativeY = Math.min(rect.height - 1, Math.max(0, clientY - rect.top));
      return Math.min(groups.length - 1, Math.floor((relativeY / rect.height) * groups.length));
    },
    [groups.length]
  );

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const idx = indexFromClientY(clientY);
      if (idx === null) return;
      setPointerY(clientY);
      setActiveIndex((prev) => {
        if (idx !== prev) jumpTo(groups[idx].group);
        return idx;
      });
    },
    [indexFromClientY, groups]
  );

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientY(e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (activeIndex === null) return;
    updateFromClientY(e.clientY);
  }

  function endScrub() {
    setActiveIndex(null);
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

          {activeIndex !== null && scrubberRef.current && (
            <div
              className="scrubber-bubble"
              style={{
                top: pointerY,
                left: scrubberRef.current.getBoundingClientRect().left - BUBBLE_W + 12,
                width: BUBBLE_W,
                height: BUBBLE_H,
                clipPath: `path('${BELL_PATH}')`,
              }}
            >
              <span className="scrubber-bubble-text">{groups[activeIndex].short}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
